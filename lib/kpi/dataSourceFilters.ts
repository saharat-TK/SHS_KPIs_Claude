import type {
  AggregationKind,
  DataSourceCellValue,
  DataSourceColumnType,
  DataSourceFilter,
  DataSourceLinkMapping,
  DataSourcePeriodGrain,
  FilterOperator,
  MappingSlot,
} from "@/lib/types";

// Which rows of a data source count toward a KPI, and how they become a number.
//
// This module has NO runtime imports on purpose — tests load it directly under
// node's type-stripping, which cannot resolve the "@/" alias for value imports
// (type-only imports are erased, so the block above is fine). Anything it needs
// from elsewhere arrives as an argument.

/** Pseudo-field: the entry's own year/quarter rather than one of its columns. */
export const PERIOD_FIELD = "__period";

/** Period filter operands are always "YYYY-Q" — both bounds explicit, so there
 *  is no "does 2568 mean Q1 or Q4" ambiguity. */
const PERIOD_RE = /^(\d{4})-([1-4])$/;

// Kept in step with ISO_DATE_RE in lib/kpi/dataSources.ts. Duplicated rather than
// imported because of the no-runtime-imports rule above; both must agree, since a
// date bound is compared against a cell that coerceCellValue already validated.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Thrown for user-fixable filter problems. Mirrors DataSourceValidationError in
 *  lib/kpi/dataSources.ts (same reason it is not imported). */
export class FilterValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FilterValidationError";
  }
}

const invalid = (message: string) => new FilterValidationError(message);

/** What the filter logic needs to know about a column. */
export interface FilterColumnSpec {
  colKey: string;
  label: string;
  dataType: DataSourceColumnType;
  options?: string[] | null;
}

/** An entry as the filter sees it. `values` is the parsed values_json. */
export interface FilterableEntry {
  id: number;
  year: number;
  quarter: number | null;
  values: Record<string, DataSourceCellValue>;
}

export const AGGREGATION_KINDS: AggregationKind[] = ["sum", "avg", "count", "latest"];

export const AGGREGATION_LABELS: Record<AggregationKind, string> = {
  sum: "Sum of",
  avg: "Average of",
  count: "Count of rows",
  latest: "Latest value of",
};

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "is",
  gte: "is at least",
  lte: "is at most",
  between: "is between",
};

/** "count" needs no column to aggregate; everything else does. */
export const aggregationNeedsColumn = (kind: AggregationKind) => kind !== "count";

/** Operators offered for a column type. Deliberately minimal — a date is always
 *  a range, and choice-like columns only ever make sense as equality. */
export function operatorsFor(dataType: DataSourceColumnType): FilterOperator[] {
  switch (dataType) {
    case "number":
      return ["eq", "gte", "lte", "between"];
    case "date":
      return ["between"];
    default:
      return ["eq"];
  }
}

/** Sortable position of a period. Annual entries (quarter null) sort as Q1 of
 *  their year, matching the feed rule that a yearly figure counts from Q1. */
export function periodOrdinal(year: number, quarter: number | null): number {
  return year * 4 + ((quarter ?? 1) - 1);
}

function parsePeriodOperand(raw: unknown, label: string): number {
  const m = PERIOD_RE.exec(String(raw ?? ""));
  if (!m) throw invalid(`${label} must be a period like "2568-1"`);
  return periodOrdinal(Number(m[1]), Number(m[2]));
}

/** Year out of a "YYYY" or "YYYY-Q" operand, for annual sources where the
 *  quarter half is meaningless. */
function parseYear(raw: string, label: string): number {
  const m = /^(\d{4})(?:-[1-4])?$/.exec(raw);
  if (!m) throw invalid(`${label} must be a year like "2568"`);
  return Number(m[1]);
}

/** Coerce a filter operand to something comparable against a stored cell.
 *  Stored cells were already coerced on write by validateEntryValues, so this
 *  only has to bring the operand into the same shape. */
function normalizeOperand(
  column: FilterColumnSpec,
  raw: unknown,
  what: string,
): string | number | boolean {
  if (raw === null || raw === undefined || raw === "") {
    throw invalid(`${what} needs a value`);
  }
  switch (column.dataType) {
    case "number": {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw invalid(`${what} must be a number`);
      return n;
    }
    case "date": {
      const s = String(raw);
      if (!ISO_DATE_RE.test(s) || Number.isNaN(Date.parse(s))) {
        throw invalid(`${what} must be a date (YYYY-MM-DD)`);
      }
      return s;
    }
    case "boolean": {
      if (typeof raw === "boolean") return raw;
      if (raw === "true" || raw === 1 || raw === "1") return true;
      if (raw === "false" || raw === 0 || raw === "0") return false;
      throw invalid(`${what} must be true or false`);
    }
    default: {
      const s = String(raw);
      const options = column.options ?? [];
      if (column.dataType === "select" && options.length > 0 && !options.includes(s)) {
        throw invalid(`${what} must be one of: ${options.join(", ")}`);
      }
      return s;
    }
  }
}

/** Compare two already-normalised values. ISO dates sort correctly as strings,
 *  so date ranges need no special casing here. */
function cmp(a: string | number | boolean, b: string | number | boolean): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  const as = String(a);
  const bs = String(b);
  return as < bs ? -1 : as > bs ? 1 : 0;
}

function cellMatches(
  column: FilterColumnSpec,
  cell: DataSourceCellValue,
  filter: DataSourceFilter,
): boolean {
  // A blank cell never satisfies a condition — "unknown" is not a match.
  if (cell === null || cell === undefined || cell === "") return false;

  const left = cell as string | number | boolean;
  switch (filter.operator) {
    case "eq":
      return cmp(left, normalizeOperand(column, filter.value, "Value")) === 0;
    case "gte":
      return cmp(left, normalizeOperand(column, filter.value, "Value")) >= 0;
    case "lte":
      return cmp(left, normalizeOperand(column, filter.value, "Value")) <= 0;
    case "between": {
      const lo = normalizeOperand(column, filter.value, "Range start");
      const hi = normalizeOperand(column, filter.valueTo, "Range end");
      return cmp(left, lo) >= 0 && cmp(left, hi) <= 0; // both bounds inclusive
    }
    default:
      return false;
  }
}

/** True when the entry satisfies every filter (they are ANDed). */
export function matchesFilters(
  entry: FilterableEntry,
  columns: FilterColumnSpec[],
  filters: DataSourceFilter[],
): boolean {
  const byKey = new Map(columns.map((c) => [c.colKey, c]));

  for (const filter of filters) {
    if (filter.field === PERIOD_FIELD) {
      const ord = periodOrdinal(entry.year, entry.quarter);
      const lo = parsePeriodOperand(filter.value, "Range start");
      const hi = parsePeriodOperand(filter.valueTo, "Range end");
      if (ord < lo || ord > hi) return false;
      continue;
    }

    const column = byKey.get(filter.field);
    // A filter on a column that has since been deleted matches nothing, rather
    // than silently widening the result set.
    if (!column) return false;
    if (!cellMatches(column, entry.values[filter.field] ?? null, filter)) return false;
  }
  return true;
}

function numericCells(
  entries: FilterableEntry[],
  columnKey: string,
): number[] {
  const out: number[] = [];
  for (const e of entries) {
    const raw = e.values[columnKey];
    if (raw === null || raw === undefined || raw === "") continue;
    const n = Number(raw);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/** Reduce the matching entries to one number.
 *
 *  `count` always yields a number (zero rows is a meaningful zero). The others
 *  yield null when no row carries a usable value, so the KPI shows "—" rather
 *  than a misleading 0 for "nothing recorded yet". */
export function aggregate(
  kind: AggregationKind,
  columnKey: string | null,
  entries: FilterableEntry[],
): number | null {
  if (kind === "count") return entries.length;
  if (!columnKey) return null;

  if (kind === "latest") {
    const withValue = entries.filter((e) => {
      const v = e.values[columnKey];
      return v !== null && v !== undefined && v !== "";
    });
    if (withValue.length === 0) return null;
    // Newest by period, then by insertion order for same-period rows.
    const newest = withValue.reduce((best, e) => {
      const a = periodOrdinal(e.year, e.quarter);
      const b = periodOrdinal(best.year, best.quarter);
      return a > b || (a === b && e.id > best.id) ? e : best;
    });
    const n = Number(newest.values[columnKey]);
    return Number.isFinite(n) ? n : null;
  }

  const nums = numericCells(entries, columnKey);
  if (nums.length === 0) return null;
  const total = nums.reduce((s, n) => s + n, 0);
  return kind === "avg" ? total / nums.length : total;
}

/** Validate + normalise the mappings stored on a link. Throws on the first
 *  problem so the API can surface the message straight to a toast. */
export function validateMappings(
  columns: FilterColumnSpec[],
  grain: DataSourcePeriodGrain,
  raw: unknown,
): DataSourceLinkMapping[] {
  if (raw === null || raw === undefined) return [];
  if (!Array.isArray(raw)) throw invalid("mappings must be a list");
  if (raw.length > 2) throw invalid("A link can carry at most two mappings");

  const byKey = new Map(columns.map((c) => [c.colKey, c]));
  const seenSlots = new Set<string>();

  return raw.map((m) => {
    const slot = (m?.slot ?? "value") as MappingSlot;
    if (!["value", "variable1", "variable2"].includes(slot)) {
      throw invalid(`Unknown mapping target "${slot}"`);
    }
    if (seenSlots.has(slot)) throw invalid(`Two mappings both feed "${slot}"`);
    seenSlots.add(slot);

    const aggregation = m?.aggregation as AggregationKind;
    if (!AGGREGATION_KINDS.includes(aggregation)) {
      throw invalid(`Unknown aggregation "${m?.aggregation}"`);
    }

    let columnKey: string | null = m?.columnKey?.trim() || null;
    if (aggregationNeedsColumn(aggregation)) {
      if (!columnKey) {
        throw invalid(`"${AGGREGATION_LABELS[aggregation]}" needs a column to aggregate`);
      }
      const col = byKey.get(columnKey);
      if (!col) throw invalid(`Unknown column "${columnKey}"`);
      if (col.dataType !== "number") {
        throw invalid(`"${col.label}" is not a number column, so it cannot be aggregated`);
      }
    } else {
      columnKey = null; // count ignores it; don't store a misleading value
    }

    const filters = Array.isArray(m?.filters) ? m.filters : [];
    return {
      slot,
      aggregation,
      columnKey,
      filters: filters.map((f: DataSourceFilter) =>
        validateFilter(byKey, grain, f),
      ),
    };
  });
}

function validateFilter(
  byKey: Map<string, FilterColumnSpec>,
  grain: DataSourcePeriodGrain,
  f: DataSourceFilter,
): DataSourceFilter {
  const operator = f?.operator;

  if (f?.field === PERIOD_FIELD) {
    if (operator !== "between") throw invalid("A period filter must be a range");

    let value = String(f.value ?? "");
    let valueTo = String(f.valueTo ?? "");
    if (grain === "annual") {
      // Annual entries carry no quarter and all sort as Q1 of their year, so a
      // quarter-precise range would be a trap: "2568-2 → 2568-4" would match
      // nothing at all. Widen to whole years instead of silently returning zero.
      value = `${parseYear(value, "Range start")}-1`;
      valueTo = `${parseYear(valueTo, "Range end")}-4`;
    }
    if (parsePeriodOperand(value, "Range start") > parsePeriodOperand(valueTo, "Range end")) {
      throw invalid("The period range starts after it ends");
    }
    return { field: PERIOD_FIELD, operator, value, valueTo };
  }

  const column = byKey.get(f?.field);
  if (!column) throw invalid(`Unknown column "${f?.field}"`);

  const allowed = operatorsFor(column.dataType);
  if (!allowed.includes(operator)) {
    throw invalid(
      `"${column.label}" does not support "${OPERATOR_LABELS[operator] ?? operator}"`,
    );
  }

  const value = normalizeOperand(column, f.value, `"${column.label}"`);
  if (operator === "between") {
    const valueTo = normalizeOperand(column, f.valueTo, `"${column.label}" range end`);
    if (cmp(value, valueTo) > 0) {
      throw invalid(`"${column.label}" range starts after it ends`);
    }
    return { field: column.colKey, operator, value, valueTo };
  }
  return { field: column.colKey, operator, value };
}

/** Human summary of one filter, e.g. `Quartile is Q1`. `labels` resolves derived
 *  codes (faculty ids, program abbrs) the same way formatCellValue does. */
export function describeFilter(
  filter: DataSourceFilter,
  columns: FilterColumnSpec[],
  labels?: Record<string, string>,
): string {
  const show = (v: unknown) => {
    const s = String(v ?? "");
    return labels?.[s] ?? s;
  };

  if (filter.field === PERIOD_FIELD) {
    return `Period is ${show(filter.value)} → ${show(filter.valueTo)}`;
  }
  const column = columns.find((c) => c.colKey === filter.field);
  const name = column?.label ?? filter.field;
  const op = OPERATOR_LABELS[filter.operator] ?? filter.operator;

  return filter.operator === "between"
    ? `${name} ${op} ${show(filter.value)} → ${show(filter.valueTo)}`
    : `${name} ${op} ${show(filter.value)}`;
}

/** Human summary of a whole mapping, for the Linked KPIs table. */
export function describeMapping(
  mapping: DataSourceLinkMapping,
  columns: FilterColumnSpec[],
  labels?: Record<string, string>,
): string {
  const column = columns.find((c) => c.colKey === mapping.columnKey);
  const head =
    mapping.aggregation === "count"
      ? AGGREGATION_LABELS.count
      : `${AGGREGATION_LABELS[mapping.aggregation]} ${column?.label ?? mapping.columnKey}`;

  if (mapping.filters.length === 0) return head;
  return `${head} where ${mapping.filters
    .map((f) => describeFilter(f, columns, labels))
    .join(" and ")}`;
}
