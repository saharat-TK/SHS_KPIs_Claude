// The Data Table page's model: the dashboard's filtered KPIs laid out as
// Group → KPI → sub-KPI rows, each with a cell per year of the record and the
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

export interface DataTableGroup {
  id: string;
  label: string;
  years: GroupYearCell[];
  kpis: DataTableKpi[];
}

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
 */
export function buildDataTable(args: {
  kpis: DashboardKpi[];
  groups: DashboardCategory[];
  categories: DashboardCategory[];
  metrics: Map<number, DataTableMetric[]>;
  quarter: number;
  yearCount?: number;
}): DataTableGroup[] {
  const { kpis, groups, categories, metrics, quarter, yearCount = DATA_TABLE_YEARS } = args;
  return groups
    .map((g) => {
      const members = [...kpisInGroup(kpis, g.id, categories)].sort((a, b) =>
        NAME_ORDER.compare(a.name, b.name),
      );
      const years = yearNos(yearCount).map((yearNo) => {
        const pct = averageAchievement(members.map((k) => kpiStatusAsOf(k, yearNo, quarter)));
        return {
          yearNo,
          pct,
          health: pct == null ? null : healthOf(pct, DEFAULT_THRESHOLDS),
        };
      });
      return {
        id: g.id,
        label: g.label,
        years,
        kpis: members.map(
          (k): DataTableKpi => ({
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
          }),
        ),
      };
    })
    .filter((g) => g.kpis.length > 0);
}

// ── Expansion ────────────────────────────────────────────────────────────────
// Keys for the expanded-row set: a group's rows show when its key is in the
// set, a KPI's sub-KPIs when its key is.

export const groupKey = (id: string) => `g:${id}`;
export const kpiKey = (id: number) => `k:${id}`;

/** Every expandable key in the table — "Expand all". */
export function allExpandableKeys(groups: DataTableGroup[]): string[] {
  return groups.flatMap((g) => [
    groupKey(g.id),
    ...g.kpis.filter((k) => k.subKpis.length > 0).map((k) => kpiKey(k.id)),
  ]);
}

// ── CSV ──────────────────────────────────────────────────────────────────────

const num = (v: number | null) => (v == null ? "" : String(Math.round(v * 100) / 100));

/**
 * The table as shown: group rows always, a group's KPIs only while it is
 * expanded, a KPI's sub-KPIs only while it is expanded. Each year contributes
 * Value / Target / % columns; a group row fills only its % columns.
 */
export function buildDataTableCsv(
  groups: DataTableGroup[],
  opts: { expanded: ReadonlySet<string>; yearLabels: string[] },
): string {
  const { expanded, yearLabels } = opts;
  const header = [
    "Level",
    "Group",
    "Name",
    "Unit",
    ...yearLabels.flatMap((y) => [`${y} Value`, `${y} Target`, `${y} %`]),
    "5-Year Target",
  ];
  const rows: (string | number)[][] = [];
  const rowCells = (r: DataTableRow) =>
    r.years.flatMap((c) => [num(c.value), num(c.target), num(c.pct)]);

  for (const g of groups) {
    rows.push([
      "Group",
      g.label,
      g.label,
      "",
      ...g.years.flatMap((c) => ["", "", num(c.pct)]),
      "",
    ]);
    if (!expanded.has(groupKey(g.id))) continue;
    for (const k of g.kpis) {
      rows.push(["KPI", g.label, k.name, k.unit ?? "", ...rowCells(k), num(k.fiveYearTarget)]);
      if (!expanded.has(kpiKey(k.id))) continue;
      for (const m of k.subKpis) {
        rows.push([
          "Sub-KPI",
          g.label,
          m.name,
          m.unit ?? "",
          ...rowCells(m),
          num(m.fiveYearTarget),
        ]);
      }
    }
  }
  return UTF8_BOM + toCsv(header, rows) + "\n";
}
