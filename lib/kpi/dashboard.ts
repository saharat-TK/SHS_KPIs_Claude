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

/** Achievement per strategic group as of (yearNo, quarterNo). A group's health
 *  is derived from its own mix — healthy only when every graded KPI in it is. */
export function categorySeries(
  kpis: DashboardKpi[],
  categories: DashboardCategory[],
  yearNo: number,
  quarterNo: number,
): CategoryRow[] {
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
    };
  });
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
