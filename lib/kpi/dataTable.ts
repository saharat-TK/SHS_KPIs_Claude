// The Data Table page's model: the dashboard's filtered KPIs laid out as
// Group → KPI → sub-KPI rows (Topic → Area → Indicator code → KPI → sub-KPI
// when grouped by EdPEx), each with a cell per year of the record and the
// 5-year target. Every number comes from the same helpers the dashboard uses
// (kpiStatusAsOf, averageAchievement), so a cell here always agrees with the
// dashboard's KPI Detail table for the same year and quarter.
//
// Runtime imports are limited to pure lib helpers so tests can load this file
// directly under node's type-stripping.
import type { AnnualTarget, QuarterProgress, QuarterlyTargetMode } from "@/lib/types";
import {
  averageAchievement,
  kpiStatusAsOf,
  kpisInGroup,
  NO_EDPEX_TOPIC,
  type DashboardCategory,
  type DashboardKpi,
} from "./dashboard.ts";
import { DEFAULT_THRESHOLDS, healthOf, type Health } from "./progress.ts";
import { toCsv, UTF8_BOM } from "../csv.ts";

/** How many years a performance record spans. */
export const DATA_TABLE_YEARS = 5;

/** One year of one row, read as of the selected quarter of that year. */
export interface YearCell {
  yearNo: number;
  value: number | null;
  /** The as-of-quarter target — the same one `pct` is measured against. */
  target: number | null;
  pct: number | null;
  health: Health | null;
}

export interface DataTableRow {
  id: number;
  name: string;
  unit: string | null;
  fiveYearTarget: number | null;
  years: YearCell[];
}

export interface DataTableKpi extends DataTableRow {
  subKpis: DataTableRow[];
}

/** A group's yearly summary is the mean achievement of its KPIs. */
export interface GroupYearCell {
  yearNo: number;
  pct: number | null;
  health: Health | null;
}

/** One EdPEx indicator code inside an area: the third group level. */
export interface DataTableIndicator {
  id: string;
  label: string;
  years: GroupYearCell[];
  kpis: DataTableKpi[];
}

/** An EdPEx area inside a topic group: a second group level, summarised the
 *  same way as its topic. */
export interface DataTableArea {
  id: string;
  label: string;
  years: GroupYearCell[];
  kpis: DataTableKpi[];
  /** The area's KPIs again, split by indicator code. */
  indicators: DataTableIndicator[];
}

export interface DataTableGroup {
  id: string;
  label: string;
  years: GroupYearCell[];
  /** Every KPI of the group, whether or not it is split into areas. */
  kpis: DataTableKpi[];
  /** Set only for an EdPEx topic: its KPIs again, split by area. */
  areas?: DataTableArea[];
}

/** The slice of the EdPEx catalog the area level reads. */
export type DataTableEdpexCatalog = { id: string; areas: { id: string; name: string }[] }[];

/** Suffix of the bucket for a topic's KPIs that have no area (or a stale one). */
export const NO_EDPEX_AREA = "#none";
/** Suffix of the bucket for an area's KPIs that have no indicator code. */
export const NO_INDICATOR_CODE = "#nocode";

/** A sub-KPI as the API returns it — the fields the table reads. */
export interface DataTableMetric {
  id: number;
  perfKpiId: number;
  name: string;
  unit: string | null;
  fiveYearTarget?: number | null;
  thresholdGreen: number | null;
  thresholdAmber: number | null;
  annualTargets?: AnnualTarget[];
  progress?: QuarterProgress[];
}

const NAME_ORDER = new Intl.Collator("en", { sensitivity: "base", numeric: true });
const yearNos = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

/** Each year's value, target and achievement as of `quarter`. A sub-KPI
 *  passes its parent KPI's quarterlyTargetMode — it has none of its own. */
export function yearCells(
  item: DashboardKpi,
  quarter: number,
  yearCount = DATA_TABLE_YEARS,
): YearCell[] {
  return yearNos(yearCount).map((yearNo) => {
    const s = kpiStatusAsOf(item, yearNo, quarter);
    return { yearNo, value: s.value, target: s.quarterTarget, pct: s.pct, health: s.health };
  });
}

function metricAsKpi(m: DataTableMetric, mode: QuarterlyTargetMode): DashboardKpi {
  return {
    id: m.id,
    name: m.name,
    unit: m.unit,
    categoryId: null,
    thresholdGreen: m.thresholdGreen,
    thresholdAmber: m.thresholdAmber,
    quarterlyTargetMode: mode,
    annualTargets: m.annualTargets,
    progress: m.progress,
  };
}

/** Index sub-KPIs by their parent KPI, keeping the API's sort order. */
export function metricsByKpi(metrics: DataTableMetric[]): Map<number, DataTableMetric[]> {
  const out = new Map<number, DataTableMetric[]>();
  for (const m of metrics) {
    const list = out.get(m.perfKpiId) ?? [];
    list.push(m);
    out.set(m.perfKpiId, list);
  }
  return out;
}

/**
 * Lay the KPIs out by group. `groups` is the list in display order (from
 * groupsInUse) and `categories` what the KPIs' `categoryId` is keyed against —
 * the same pair the dashboard passes to kpisInGroup, so the UNCATEGORISED
 * bucket also collects KPIs whose category was deleted. Empty groups drop out.
 *
 * Pass `edpexCatalog` only on the "Group by: EdPEx" view: each topic group is
 * then split again by area, in catalog order, with a last "No EdPEx area"
 * bucket for KPIs that have none (or one belonging to another topic), and each
 * area once more by indicator code, with a last "No indicator code" bucket.
 */
export function buildDataTable(args: {
  kpis: DashboardKpi[];
  groups: DashboardCategory[];
  categories: DashboardCategory[];
  metrics: Map<number, DataTableMetric[]>;
  quarter: number;
  yearCount?: number;
  edpexCatalog?: DataTableEdpexCatalog;
}): DataTableGroup[] {
  const { kpis, groups, categories, metrics, quarter, edpexCatalog } = args;
  const yearCount = args.yearCount ?? DATA_TABLE_YEARS;

  // A group's (or area's) yearly summary: the mean achievement of its KPIs.
  const summaryYears = (members: DashboardKpi[]): GroupYearCell[] =>
    yearNos(yearCount).map((yearNo) => {
      const pct = averageAchievement(members.map((k) => kpiStatusAsOf(k, yearNo, quarter)));
      return { yearNo, pct, health: pct == null ? null : healthOf(pct, DEFAULT_THRESHOLDS) };
    });
  const toTableKpi = (k: DashboardKpi): DataTableKpi => ({
    id: k.id,
    name: k.name,
    unit: k.unit,
    fiveYearTarget: k.fiveYearTarget ?? null,
    years: yearCells(k, quarter, yearCount),
    subKpis: (metrics.get(k.id) ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      fiveYearTarget: m.fiveYearTarget ?? null,
      years: yearCells(metricAsKpi(m, k.quarterlyTargetMode), quarter, yearCount),
    })),
  });
  const section = (id: string, label: string, members: DashboardKpi[]) => ({
    id,
    label,
    years: summaryYears(members),
    kpis: members.map(toTableKpi),
  });
  // An area's KPIs by indicator code: codes in numeric order ("…-2" before
  // "…-10"), then a last bucket for KPIs without one. Codes are free text, so
  // they are only trimmed before matching.
  const indicatorsOf = (areaId: string, inArea: DashboardKpi[]): DataTableIndicator[] => {
    const code = (k: DashboardKpi) => k.edpexIndicatorCode?.trim() ?? "";
    const codes = [...new Set(inArea.map(code).filter(Boolean))].sort(NAME_ORDER.compare);
    return [
      ...codes.map((c) => section(`${areaId}|${c}`, c, inArea.filter((k) => code(k) === c))),
      section(
        `${areaId}${NO_INDICATOR_CODE}`,
        "No indicator code",
        inArea.filter((k) => !code(k)),
      ),
    ].filter((i) => i.kpis.length > 0);
  };

  return groups
    .map((g): DataTableGroup => {
      const members = [...kpisInGroup(kpis, g.id, categories)].sort((a, b) =>
        NAME_ORDER.compare(a.name, b.name),
      );
      const group: DataTableGroup = section(g.id, g.label, members);
      const topic = g.id === NO_EDPEX_TOPIC ? undefined : edpexCatalog?.find((t) => t.id === g.id);
      if (topic) {
        const known = new Set(topic.areas.map((a) => a.id));
        const area = (id: string, label: string, inArea: DashboardKpi[]): DataTableArea => ({
          ...section(id, label, inArea),
          indicators: indicatorsOf(id, inArea),
        });
        group.areas = [
          ...topic.areas.map((a) =>
            area(a.id, `${a.id} ${a.name}`, members.filter((k) => k.edpexAreaId === a.id)),
          ),
          area(
            `${topic.id}${NO_EDPEX_AREA}`,
            "No EdPEx area",
            members.filter((k) => !k.edpexAreaId || !known.has(k.edpexAreaId)),
          ),
        ].filter((a) => a.kpis.length > 0);
      }
      return group;
    })
    .filter((g) => g.kpis.length > 0);
}

// ── Expansion ────────────────────────────────────────────────────────────────
// Keys for the expanded-row set: a group's rows show when its key is in the
// set, an area's indicators when its key is, an indicator's KPIs when its key
// is, a KPI's sub-KPIs when its key is.

export const groupKey = (id: string) => `g:${id}`;
export const areaKey = (id: string) => `a:${id}`;
export const indicatorKey = (id: string) => `i:${id}`;
export const kpiKey = (id: number) => `k:${id}`;

/** Every expandable key in the table — "Expand all". */
export function allExpandableKeys(groups: DataTableGroup[]): string[] {
  return groups.flatMap((g) => [
    groupKey(g.id),
    ...(g.areas ?? []).flatMap((a) => [
      areaKey(a.id),
      ...a.indicators.map((i) => indicatorKey(i.id)),
    ]),
    ...g.kpis.filter((k) => k.subKpis.length > 0).map((k) => kpiKey(k.id)),
  ]);
}

// ── CSV ──────────────────────────────────────────────────────────────────────

const num = (v: number | null) => (v == null ? "" : String(Math.round(v * 100) / 100));

/**
 * The table as shown: group rows always, then each level only while its parent
 * is expanded — a group's areas (or KPIs), an area's indicators, an
 * indicator's KPIs, a KPI's sub-KPIs. Each year contributes Value / Target / %
 * columns; a group, area or indicator row fills only its % columns. Area and
 * Indicator stay blank off the EdPEx view.
 */
export function buildDataTableCsv(
  groups: DataTableGroup[],
  opts: { expanded: ReadonlySet<string>; yearLabels: string[] },
): string {
  const { expanded, yearLabels } = opts;
  const header = [
    "Level",
    "Group",
    "Area",
    "Indicator",
    "Name",
    "Unit",
    ...yearLabels.flatMap((y) => [`${y} Value`, `${y} Target`, `${y} %`]),
    "5-Year Target",
  ];
  const rows: (string | number)[][] = [];
  const rowCells = (r: DataTableRow) =>
    r.years.flatMap((c) => [num(c.value), num(c.target), num(c.pct)]);
  const summaryCells = (years: GroupYearCell[]) => years.flatMap((c) => ["", "", num(c.pct)]);

  const pushKpis = (path: [string, string, string], kpis: DataTableKpi[]) => {
    for (const k of kpis) {
      rows.push(["KPI", ...path, k.name, k.unit ?? "", ...rowCells(k), num(k.fiveYearTarget)]);
      if (!expanded.has(kpiKey(k.id))) continue;
      for (const m of k.subKpis) {
        rows.push(["Sub-KPI", ...path, m.name, m.unit ?? "", ...rowCells(m), num(m.fiveYearTarget)]);
      }
    }
  };

  for (const g of groups) {
    rows.push(["Group", g.label, "", "", g.label, "", ...summaryCells(g.years), ""]);
    if (!expanded.has(groupKey(g.id))) continue;
    if (!g.areas) {
      pushKpis([g.label, "", ""], g.kpis);
      continue;
    }
    for (const a of g.areas) {
      rows.push(["Area", g.label, a.label, "", a.label, "", ...summaryCells(a.years), ""]);
      if (!expanded.has(areaKey(a.id))) continue;
      for (const i of a.indicators) {
        rows.push(["Indicator", g.label, a.label, i.label, i.label, "", ...summaryCells(i.years), ""]);
        if (expanded.has(indicatorKey(i.id))) pushKpis([g.label, a.label, i.label], i.kpis);
      }
    }
  }
  return UTF8_BOM + toCsv(header, rows) + "\n";
}
