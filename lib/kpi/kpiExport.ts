// Export a strategic set's KPIs as CSV.
//
// The first columns are exactly the Batch Add template's (KPI_BATCH_COLUMNS),
// written as the readable labels people see, so an export goes straight back
// in through Import CSV — into this set (every row flags as a duplicate) or
// into another one. The detail columns after them are for reading only: the
// template reader matches columns by header and ignores any it doesn't know.
//
// No runtime imports beyond sibling modules: tests load this file directly
// under node's type-stripping.
import type { LibraryKpi } from "@/lib/types";
import { categoryTaxonomyForKpiType } from "./categories.ts";
import { KPI_BATCH_COLUMNS, type KpiBatchLookups } from "./kpiBatch.ts";
import { toCsv, UTF8_BOM } from "../csv.ts";

export type ExportKpi = Pick<
  LibraryKpi,
  | "name"
  | "kpiType"
  | "categoryId"
  | "routineCategoryId"
  | "committeeId"
  | "description"
  | "edpexTopicId"
  | "edpexAreaId"
  | "edpexIndicatorCode"
  | "weight"
  | "unit"
  | "fiveYearTarget"
  | "calculationType"
  | "thresholdGreen"
  | "thresholdAmber"
  | "collectionPeriod"
  | "isDraft"
  | "metricCount"
  | "annualTargets"
>;

export interface ExportSet {
  startYear: number;
  endYear: number;
}

const CALCULATION_LABELS: Record<string, string> = {
  weighted_sum: "Weighted sum",
  simple_average: "Simple average",
  percent_of_total: "Percent of total",
  ratio_of_total: "Ratio of total",
  combined_percent: "Combined percent",
  combined_ratio: "Combined ratio",
  custom_formula: "Custom formula",
};

const COLLECTION_LABELS: Record<string, string> = {
  Q1: "Quarter 1",
  Q2: "Quarter 2",
  Q3: "Quarter 3",
  Q4: "Quarter 4",
  every_quarter: "Every quarter",
};

const YEARS = [1, 2, 3, 4, 5] as const;

/** The detail headers, with each target column naming its B.E. year. */
export function kpiExportDetailHeaders(set: ExportSet): string[] {
  return [
    "Weight (%)",
    "Unit",
    ...YEARS.map((y) => `Target Y${y} (${set.startYear + y - 1})`),
    "5-Year Target",
    "Calculation",
    "Green Threshold",
    "Amber Threshold",
    "Collection Period",
    "Draft",
    "Sub-KPIs",
  ];
}

const num = (v: number | null | undefined) => (v == null ? "" : v);

export function buildKpiExportCsv(
  kpis: ExportKpi[],
  lookups: Pick<KpiBatchLookups, "kpiTypes" | "categories" | "committees">,
  set: ExportSet,
): string {
  const typeLabel = new Map(lookups.kpiTypes.map((t) => [t.id, t.label]));
  const categoryLabel = new Map(lookups.categories.map((c) => [c.id, c.label]));
  const committeeName = new Map(lookups.committees.map((c) => [c.id, c.name]));

  const headers = [...KPI_BATCH_COLUMNS.map((c) => c.label), ...kpiExportDetailHeaders(set)];

  const rows = kpis.map((k) => {
    // A KPI's one category lives in the column its type groups by — the same
    // rule toKpiCreateInput applies on the way in.
    const routine = categoryTaxonomyForKpiType(k.kpiType) === "routine";
    const categoryId = routine ? k.routineCategoryId : k.categoryId;
    const target = (yearNo: number) =>
      num(k.annualTargets?.find((t) => t.yearNo === yearNo)?.targetValue);

    return [
      k.name,
      typeLabel.get(k.kpiType) ?? k.kpiType,
      categoryId ? categoryLabel.get(categoryId) ?? categoryId : "",
      k.committeeId ? committeeName.get(k.committeeId) ?? k.committeeId : "",
      k.description ?? "",
      k.edpexTopicId ?? "",
      k.edpexAreaId ?? "",
      k.edpexIndicatorCode ?? "",
      num(k.weight),
      k.unit ?? "",
      ...YEARS.map(target),
      num(k.fiveYearTarget),
      CALCULATION_LABELS[k.calculationType] ?? k.calculationType,
      num(k.thresholdGreen),
      num(k.thresholdAmber),
      COLLECTION_LABELS[k.collectionPeriod] ?? k.collectionPeriod,
      k.isDraft ? "Yes" : "No",
      k.metricCount ?? 0,
    ];
  });

  return UTF8_BOM + toCsv(headers, rows) + "\n";
}

/** kpis-2565-2569-2026-11-26.csv */
export function buildKpiExportFilename(set: ExportSet, today: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return `kpis-${set.startYear}-${set.endYear}-${date}.csv`;
}
