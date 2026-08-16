// Pure aggregation behind the home dashboard: turn one performance record's KPIs
// into the numbers the stat cards, charts and table render.
//
// KPIs in a record carry mixed units (Item / Percent / Ratio), so their raw
// values can never be summed or averaged against each other. Everything here
// therefore works in ACHIEVEMENT PERCENT — value ÷ target × 100 — which is
// unit-free and comparable, and is graded against each KPI's own green/amber
// cutoffs.
//
// Runtime imports are limited to lib/kpi/progress.ts, which is itself
// import-free, so tests can load this module directly under node's
// type-stripping. The ".ts" extension is required for that (node resolves the
// real file); tsconfig sets allowImportingTsExtensions for it. Do not import a
// JSX module or anything that reaches the MySQL pool.
import type {
  AnnualTarget,
  PerformanceStatus,
  QuarterProgress,
  QuarterlyTargetMode,
} from "@/lib/types";
import {
  healthOf,
  percentOfTarget,
  quarterTargetFor,
  targetForYear,
  valueAsOfQuarter,
  type Health,
} from "./progress.ts";

export const QUARTERS = [1, 2, 3, 4] as const;

/** The slice of a PerformanceRecord the record picker reads. */
export interface DashboardRecord {
  id: number;
  status: PerformanceStatus;
  activatedAt: string;
  openPeriodCount?: number;
}

/** The slice of a PerfKpi the dashboard reads. A PerfKpi satisfies this. */
export interface DashboardKpi {
  id: number;
  name: string;
  unit: string | null;
  categoryId: string | null;
  thresholdGreen: number | null;
  thresholdAmber: number | null;
  quarterlyTargetMode: QuarterlyTargetMode;
  annualTargets?: AnnualTarget[];
  progress?: QuarterProgress[];
  /** Routine-taxonomy category — the ด้านที่ 1–7 operating areas. Wholly
   *  independent of categoryId: a KPI may carry one of each. */
  routineCategoryId?: string | null;
  /** 'strategic' | 'operational' | 'routine'. Left as a string, not a closed
   *  union, because kpi_type is a DB table rather than a constant. */
  kpiType?: string | null;
}

/** A category as the dashboard groups by it. KpiCategoryRecord satisfies this. */
export interface DashboardCategory {
  id: string;
  label: string;
}

/** One KPI read at a point in time. `pct` is null when the value or the target
 *  is missing; `health` is additionally null when the KPI has no thresholds. */
export interface KpiStatus {
  kpiId: number;
  name: string;
  unit: string | null;
  categoryId: string | null;
  value: number | null;
  annualTarget: number | null;
  quarterTarget: number | null;
  pct: number | null;
  health: Health | null;
}

export interface DashboardSummary {
  /** Every KPI in scope, including those with nothing recorded. */
  total: number;
  /** KPIs with both a value and a target, so an achievement % exists. */
  withData: number;
  /** KPIs that also have thresholds, so a health status exists. */
  graded: number;
  onTarget: number;
  watch: number;
  atRisk: number;
  noData: number;
  /** Share of GRADED KPIs rated healthy. Null when nothing is graded. */
  pctOnTarget: number | null;
  /** Mean achievement % over KPIs with data. Null when there is none. */
  avgAchievement: number | null;
}

/** Placeholder group for KPIs whose category was deleted or never set. */
export const UNCATEGORISED = "__uncategorised";

/**
 * The record the dashboard opens on. Only `active` records are candidates; one
 * with open recording periods wins (that is where quarters are actually being
 * entered), then the most recently activated, then the highest id.
 */
export function pickActiveRecord<T extends DashboardRecord>(
  records: T[] | undefined,
): T | null {
  const active = (records ?? []).filter((r) => r.status === "active");
  if (active.length === 0) return null;
  return active.slice().sort((a, b) => {
    const aOpen = (a.openPeriodCount ?? 0) > 0 ? 1 : 0;
    const bOpen = (b.openPeriodCount ?? 0) > 0 ? 1 : 0;
    if (aOpen !== bOpen) return bOpen - aOpen;
    const byDate = Date.parse(b.activatedAt) - Date.parse(a.activatedAt);
    if (!Number.isNaN(byDate) && byDate !== 0) return byDate;
    return b.id - a.id;
  })[0];
}

/** One KPI's reading as of (yearNo, quarterNo). The value is the latest recorded
 *  at or before that quarter; the target is that quarter's, per the KPI's
 *  quarterly-target mode — so a divide_equally KPI is judged against a quarter
 *  of its annual target at Q1, not the whole thing. */
export function kpiStatusAsOf(
  kpi: DashboardKpi,
  yearNo: number,
  quarterNo: number,
): KpiStatus {
  const annualTarget = targetForYear(kpi.annualTargets, yearNo);
  const quarterTarget = quarterTargetFor(
    annualTarget,
    quarterNo,
    kpi.quarterlyTargetMode,
  );
  const value = valueAsOfQuarter(kpi.progress, yearNo, quarterNo);
  const pct = percentOfTarget(value, quarterTarget);
  const hasThresholds = kpi.thresholdGreen != null && kpi.thresholdAmber != null;
  return {
    kpiId: kpi.id,
    name: kpi.name,
    unit: kpi.unit,
    categoryId: kpi.categoryId,
    value,
    annualTarget,
    quarterTarget,
    pct,
    health:
      pct != null && hasThresholds
        ? healthOf(pct, { green: kpi.thresholdGreen!, amber: kpi.thresholdAmber! })
        : null,
  };
}

export function statusesAsOf(
  kpis: DashboardKpi[],
  yearNo: number,
  quarterNo: number,
): KpiStatus[] {
  return kpis.map((k) => kpiStatusAsOf(k, yearNo, quarterNo));
}

/** Mean achievement % over the statuses that have one, or null. */
export function averageAchievement(statuses: KpiStatus[]): number | null {
  const pcts = statuses.map((s) => s.pct).filter((p): p is number => p != null);
  if (pcts.length === 0) return null;
  return pcts.reduce((a, b) => a + b, 0) / pcts.length;
}

export function summarize(statuses: KpiStatus[]): DashboardSummary {
  const withData = statuses.filter((s) => s.pct != null);
  const graded = statuses.filter((s) => s.health != null);
  const count = (h: Health) => graded.filter((s) => s.health === h).length;
  const onTarget = count("healthy");
  return {
    total: statuses.length,
    withData: withData.length,
    graded: graded.length,
    onTarget,
    watch: count("watch"),
    atRisk: count("at_risk"),
    noData: statuses.length - withData.length,
    pctOnTarget: graded.length === 0 ? null : (onTarget / graded.length) * 100,
    avgAchievement: averageAchievement(statuses),
  };
}

/** Donut slices, in a fixed order so the colours never shuffle between renders. */
export function healthMix(
  summary: DashboardSummary,
): { key: Health | "no_data"; label: string; value: number }[] {
  return [
    { key: "healthy", label: "On Target", value: summary.onTarget },
    { key: "watch", label: "Watch", value: summary.watch },
    { key: "at_risk", label: "At Risk", value: summary.atRisk },
    { key: "no_data", label: "No Data", value: summary.noData },
  ];
}

// ── KPI type ─────────────────────────────────────────────────────────────────

/**
 * The KPIs of one type, projected so `categoryId` carries the taxonomy that type
 * is actually grouped by: routine KPIs group by their ด้านที่ area, every other
 * type by its strategic category. Operational has no taxonomy of its own
 * (kpi_type.applies_to_categories = 0), so it rides along with strategic.
 *
 * Doing the swap here is what keeps the rest of this module to ONE grouping key
 * — groupsInUse, kpisInGroup, categoryDetail and quarterSeries need no
 * parameterising, because the caller has already decided what categoryId means
 * for the view being built.
 *
 * The match on kpiType is exact. Coercing an unrecognised slug to "strategic"
 * would quietly file a KPI under the wrong view; instead the type toggle is
 * driven off the kpi_type table, so a new type gets its own option rather than
 * disappearing into someone else's.
 */
export function kpisOfType(kpis: DashboardKpi[], type: string): DashboardKpi[] {
  const mine = kpis.filter((k) => k.kpiType === type);
  if (type !== "routine") return mine;
  // Copy rather than mutate — the caller still holds the unprojected list to
  // count types from.
  return mine.map((k) => ({ ...k, categoryId: k.routineCategoryId ?? null }));
}

/** How many KPIs of each type the record holds, over EVERY KPI regardless of
 *  the current selection. Drives the type toggle's counts and which of its
 *  options are worth offering. */
export function countByType(kpis: DashboardKpi[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const k of kpis) {
    const t = k.kpiType ?? "";
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts;
}

// ── Targets met ──────────────────────────────────────────────────────────────

/** The "N of M KPIs met target" headline. Deliberately NOT DashboardSummary's
 *  pctOnTarget: that divides by the GRADED count, so a record where half the
 *  KPIs were never recorded reports on the half that were and reads high. Here
 *  the denominator is every KPI in scope, and `graded` is carried alongside so
 *  the caller can name the "cannot tell yet" tail rather than hiding it. */
export interface TargetsMet {
  /** KPIs graded healthy — the ones that actually met their quarter target. */
  met: number;
  /** Every KPI in scope, gradable or not. */
  total: number;
  /** KPIs carrying a health verdict at all. `total - graded` is the tail. */
  graded: number;
  /** met ÷ total × 100. Null only when nothing is in scope. */
  pctOfAll: number | null;
}

export function targetsMet(statuses: KpiStatus[]): TargetsMet {
  const met = statuses.filter((s) => s.health === "healthy").length;
  const graded = statuses.filter((s) => s.health != null).length;
  const total = statuses.length;
  return {
    met,
    total,
    graded,
    pctOfAll: total === 0 ? null : (met / total) * 100,
  };
}

// ── Recording completeness ───────────────────────────────────────────────────

/** Where a KPI's reading at (yearNo, quarterNo) came from.
 *  - "recorded" — a value was entered for that exact quarter.
 *  - "carried"  — nothing that quarter, but an earlier quarter of the SAME year
 *                 has one, which is what valueAsOfQuarter shows the rest of the
 *                 dashboard. Normal for a use_annual KPI that only fills Q3.
 *  - "missing"  — neither, so every number derived from this KPI is absent. */
export type RecordingState = "recorded" | "carried" | "missing";

export function recordingStateAsOf(
  kpi: DashboardKpi,
  yearNo: number,
  quarterNo: number,
): RecordingState {
  const exact = (kpi.progress ?? []).find(
    (p) => p.yearNo === yearNo && p.quarterNo === quarterNo,
  );
  // A row can exist with a null progressValue (issue typed, no number yet), so
  // the row's presence is not the test — the value is.
  if (exact && exact.progressValue != null) return "recorded";
  // valueAsOfQuarter's loop starts AT quarterNo, which we just ruled out, so a
  // non-null answer here necessarily came from a strictly earlier quarter.
  return valueAsOfQuarter(kpi.progress, yearNo, quarterNo) != null
    ? "carried"
    : "missing";
}

export interface RecordingMix {
  recorded: number;
  carried: number;
  missing: number;
  total: number;
  /** Share of all KPIs entered for THIS quarter. Null when nothing is in scope. */
  pctThisQuarter: number | null;
  /** Share with any reading as of this quarter (recorded + carried). */
  pctWithReading: number | null;
}

export function recordingMix(
  kpis: DashboardKpi[],
  yearNo: number,
  quarterNo: number,
): RecordingMix {
  let recorded = 0;
  let carried = 0;
  for (const k of kpis) {
    const state = recordingStateAsOf(k, yearNo, quarterNo);
    if (state === "recorded") recorded++;
    else if (state === "carried") carried++;
  }
  const total = kpis.length;
  return {
    recorded,
    carried,
    missing: total - recorded - carried,
    total,
    pctThisQuarter: total === 0 ? null : (recorded / total) * 100,
    pctWithReading: total === 0 ? null : ((recorded + carried) / total) * 100,
  };
}

/** Donut slices in a fixed order, so the colours never shuffle between renders
 *  — the same contract as healthMix. */
export function recordingSlices(
  mix: RecordingMix,
): { key: RecordingState; label: string; value: number }[] {
  return [
    { key: "recorded", label: "Recorded", value: mix.recorded },
    { key: "carried", label: "Carried Forward", value: mix.carried },
    { key: "missing", label: "Not Recorded", value: mix.missing },
  ];
}

// ── Issues & remedies ────────────────────────────────────────────────────────

export interface IssueRow {
  kpiId: number;
  kpiName: string;
  categoryId: string | null;
  yearNo: number;
  quarterNo: number;
  /** Always non-empty — rows without one are not returned. */
  issue: string;
  solution: string | null;
}

/** Trim to null. A blank string and an unset column mean the same thing here,
 *  and only one of them is falsy. */
function normalizeNote(s: string | null | undefined): string | null {
  const t = (s ?? "").trim();
  return t === "" ? null : t;
}

/** Every issue a recorder typed for `yearNo`, up to and including `quarterNo`
 *  (omit it for the whole year). Newest quarter first, then the KPIs' own order,
 *  so the freshest problems lead.
 *
 *  Only hand-entered rows ever appear: the roll-up and data-source engines write
 *  progressValue and the variable columns but never these two, so an empty
 *  result is a normal state and not a fault. */
export function issuesAsOf(
  kpis: DashboardKpi[],
  yearNo: number,
  quarterNo = 4,
): IssueRow[] {
  const rows: IssueRow[] = [];
  for (const k of kpis) {
    for (const p of k.progress ?? []) {
      if (p.yearNo !== yearNo || p.quarterNo > quarterNo) continue;
      const issue = normalizeNote(p.issue);
      if (issue == null) continue;
      rows.push({
        kpiId: k.id,
        kpiName: k.name,
        categoryId: k.categoryId,
        yearNo: p.yearNo,
        quarterNo: p.quarterNo,
        issue,
        solution: normalizeNote(p.solution),
      });
    }
  }
  // Stable within a quarter: Array.prototype.sort is stable in every runtime
  // this ships to, so equal quarters keep the KPI order the API sent.
  return rows.sort((a, b) => b.quarterNo - a.quarterNo);
}

/** The groups actually present in this record, in the categories' own order,
 *  with anything unmatched collected under UNCATEGORISED. A record that uses 2
 *  of the set's 8 categories yields 2 rows — never 8 empty ones. */
export function groupsInUse(
  kpis: DashboardKpi[],
  categories: DashboardCategory[],
): DashboardCategory[] {
  const used = new Set(kpis.map((k) => k.categoryId ?? UNCATEGORISED));
  const known = new Set(categories.map((c) => c.id));
  const groups = categories.filter((c) => used.has(c.id));
  const hasOrphans = kpis.some(
    (k) => k.categoryId == null || !known.has(k.categoryId),
  );
  if (hasOrphans) groups.push({ id: UNCATEGORISED, label: "Uncategorised" });
  return groups;
}

/** The KPIs in one group. Pass `categories` so UNCATEGORISED also collects KPIs
 *  pointing at a category that no longer exists — otherwise groupsInUse would
 *  offer a group that lists nothing. */
export function kpisInGroup(
  kpis: DashboardKpi[],
  groupId: string,
  categories?: DashboardCategory[],
): DashboardKpi[] {
  if (groupId !== UNCATEGORISED) return kpis.filter((k) => k.categoryId === groupId);
  if (!categories) return kpis.filter((k) => k.categoryId == null);
  const known = new Set(categories.map((c) => c.id));
  return kpis.filter((k) => k.categoryId == null || !known.has(k.categoryId));
}

export interface CategoryRow {
  id: string;
  label: string;
  pct: number | null;
  health: Health | null;
  total: number;
  onTarget: number;
}

export interface CategoryDetailRow extends CategoryRow {
  /** onTarget ÷ total × 100 — the share of the group's KPIs that met target,
   *  over EVERY KPI in it. Same denominator rule as targetsMet().pctOfAll, and
   *  deliberately a different quantity from `pct`, which is mean achievement:
   *  a group can average 106% while only 3 of its 5 KPIs met target. */
  pctMet: number | null;
  /** The group's own KPIs, in the order they were passed in (the API sorts by
   *  sort_order then id, so this matches the record page). */
  statuses: KpiStatus[];
}

/** Achievement per strategic group as of (yearNo, quarterNo), with the group's
 *  own KPI readings attached. A group's health is derived from its own mix —
 *  healthy only when every graded KPI in it is. */
export function categoryDetail(
  kpis: DashboardKpi[],
  categories: DashboardCategory[],
  yearNo: number,
  quarterNo: number,
): CategoryDetailRow[] {
  return groupsInUse(kpis, categories).map((g) => {
    const statuses = statusesAsOf(
      kpisInGroup(kpis, g.id, categories),
      yearNo,
      quarterNo,
    );
    const s = summarize(statuses);
    return {
      id: g.id,
      label: g.label,
      pct: s.avgAchievement,
      health:
        s.graded === 0
          ? null
          : s.atRisk > 0
            ? "at_risk"
            : s.watch > 0
              ? "watch"
              : "healthy",
      total: s.total,
      onTarget: s.onTarget,
      pctMet: s.total === 0 ? null : (s.onTarget / s.total) * 100,
      statuses,
    };
  });
}

/** The lean per-group row the bar chart plots. A projection of categoryDetail,
 *  so the two can never disagree about a group's achievement or health. */
export function categorySeries(
  kpis: DashboardKpi[],
  categories: DashboardCategory[],
  yearNo: number,
  quarterNo: number,
): CategoryRow[] {
  return categoryDetail(kpis, categories, yearNo, quarterNo).map(
    ({ id, label, pct, health, total, onTarget }) => ({
      id,
      label,
      pct,
      health,
      total,
      onTarget,
    }),
  );
}

export interface SeriesLine {
  key: string;
  label: string;
}

/** Q1→Q4 achievement for the selected year: one line overall, plus one per group
 *  when more than one group is in scope. Recharts wants a row per x value. */
export function quarterSeries(
  kpis: DashboardKpi[],
  categories: DashboardCategory[],
  yearNo: number,
): { rows: Record<string, string | number>[]; lines: SeriesLine[] } {
  const groups = groupsInUse(kpis, categories);
  const lines: SeriesLine[] = [{ key: "overall", label: "Overall" }];
  if (groups.length > 1) {
    for (const g of groups) lines.push({ key: `g_${g.id}`, label: g.label });
  }
  const rows = QUARTERS.map((q) => {
    const row: Record<string, string | number> = { quarter: `Q${q}` };
    const overall = averageAchievement(statusesAsOf(kpis, yearNo, q));
    if (overall != null) row.overall = round1(overall);
    if (groups.length > 1) {
      for (const g of groups) {
        const pct = averageAchievement(
          statusesAsOf(kpisInGroup(kpis, g.id, categories), yearNo, q),
        );
        if (pct != null) row[`g_${g.id}`] = round1(pct);
      }
    }
    return row;
  });
  return { rows, lines };
}

/** Overall achievement this quarter minus the quarter before it, both read from
 *  quarterSeries' own rows — null for Q1 (no prior quarter within this year; a
 *  prior-year Q4 lookback is deliberately out of scope) or when either quarter
 *  has no recorded overall value yet. */
export function quarterOverQuarterDelta(
  rows: Record<string, string | number>[],
  quarterNo: number,
): number | null {
  if (quarterNo <= 1) return null;
  const current = rows.find((r) => r.quarter === `Q${quarterNo}`)?.overall;
  const previous = rows.find((r) => r.quarter === `Q${quarterNo - 1}`)?.overall;
  if (typeof current !== "number" || typeof previous !== "number") return null;
  return round1(current - previous);
}

export interface YearRow {
  year: string;
  yearNo: number;
  achievement: number | null;
  /** Constant 100 — the "met the target" reference the bars are read against. */
  target: number;
  recorded: number;
}

/** Year 1→5 achievement at the selected quarter, for the whole-record view.
 *  `startYear` renders the Buddhist-era calendar year on the axis. */
export function yearSeries(
  kpis: DashboardKpi[],
  quarterNo: number,
  startYear: number,
  yearCount = 5,
): YearRow[] {
  return Array.from({ length: yearCount }, (_, i) => i + 1).map((yearNo) => {
    const statuses = statusesAsOf(kpis, yearNo, quarterNo);
    const achievement = averageAchievement(statuses);
    return {
      year: String(startYear + yearNo - 1),
      yearNo,
      achievement: achievement == null ? null : round1(achievement),
      target: 100,
      recorded: statuses.filter((s) => s.pct != null).length,
    };
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
