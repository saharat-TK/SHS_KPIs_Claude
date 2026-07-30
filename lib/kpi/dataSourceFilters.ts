import type {
  AggregationKind,
  DataSourceCellValue,
  DataSourceColumnType,
  DataSourceFilter,
  DataSourceLinkMapping,
  DataSourcePeriodGrain,
  DenominatorSource,
  FilterOperator,
  MappingSlot,
  Rank,
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

// Mirrors RANKS in lib/types.ts, duplicated for the same no-runtime-imports
// reason. Both must agree with the faculty.rank ENUM in the schema.
const VALID_RANKS: Rank[] = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
  "Support Staff",
];

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

export const AGGREGATION_KINDS: AggregationKind[] = [
  "sum",
  "avg",
  "count",
  "latest",
  "percent_of",
  "ratio_of",
];

export const AGGREGATION_LABELS: Record<AggregationKind, string> = {
  sum: "Sum of",
  avg: "Average of",
  count: "Count of rows",
  latest: "Latest value of",
  percent_of: "Percent of",
  ratio_of: "Ratio of",
};

/** The kinds that split a population into a numerator and a denominator, and so
 *  carry a second condition list. */
export const isProportionKind = (kind: AggregationKind) =>
  kind === "percent_of" || kind === "ratio_of";

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "is",
  in: "is any of",
  gte: "is at least",
  lte: "is at most",
  between: "is between",
};

/** Operators that take a list of values rather than a single one. */
export const isMultiValueOperator = (op: FilterOperator) => op === "in";

/** Whether a column may be aggregated at all — "count" never does. Drives
 *  whether the UI offers a column picker. */
export const aggregationAllowsColumn = (kind: AggregationKind) => kind !== "count";

/** Whether a column is mandatory. The proportion kinds merely allow one: with no
 *  column they count rows instead. Drives validation. */
export const aggregationNeedsColumn = (kind: AggregationKind) =>
  aggregationAllowsColumn(kind) && !isProportionKind(kind);

/** Operators offered for a column type. Deliberately minimal: a date is always a
 *  range, numbers get comparisons, and only choice-like columns get "is any of"
 *  — free text would invite an exact-match OR where people expect "contains",
 *  and a boolean's two values make a list pointless. */
export function operatorsFor(dataType: DataSourceColumnType): FilterOperator[] {
  switch (dataType) {
    case "number":
      return ["eq", "gte", "lte", "between"];
    case "date":
      return ["between"];
    case "select":
    case "faculty":
    case "program":
    case "curriculum":
      return ["eq", "in"];
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
    case "in": {
      // OR within this one field. An empty list matches nothing rather than
      // everything — validateFilter rejects it, so this is only a guard.
      const options = filter.values ?? [];
      return options.some(
        (v) => cmp(left, normalizeOperand(column, v, "Value")) === 0,
      );
    }
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

/** An aggregation result plus the two numbers behind it, so a KPI fed from a
 *  data source can store what it divided in variable1_value / variable2_value.
 *  `denominator` is null for the kinds that have no divisor. The parts stay
 *  populated even when `value` is null (a zero denominator, say) — they are the
 *  record of what was found, not of what could be computed. */
export interface AggregateParts {
  value: number | null;
  numerator: number | null;
  denominator: number | null;
}

const NO_PARTS: AggregateParts = { value: null, numerator: null, denominator: null };

/** Reduce the matching entries to one number, plus its numerator/denominator.
 *
 *  `count` always yields a number (zero rows is a meaningful zero). The others
 *  yield null when no row carries a usable value, so the KPI shows "—" rather
 *  than a misleading 0 for "nothing recorded yet".
 *
 *  percent_of / ratio_of are the only kinds needing more than one input, supplied
 *  via `proportion`:
 *   - `numerator` — a subset of `entries`, which is itself the denominator.
 *     Callers must derive it from the already-matched population, so a
 *     single-column result can't exceed 100%.
 *   - `numeratorColumnKey` — totals the top on a DIFFERENT column from the
 *     bottom (employed ÷ graduates, both on the same rows). Two columns are
 *     independent quantities, so this mode carries no ≤100% guarantee — 125% is
 *     real data, not something to clamp.
 *   - `denominator` — a fixed divisor (a faculty headcount) that replaces
 *     `entries` on the bottom; then `entries` IS the numerator, because the
 *     mapping's filters selected those rows directly. Wins over `numerator`. */
export function aggregateParts(
  kind: AggregationKind,
  columnKey: string | null,
  entries: FilterableEntry[],
  proportion?: {
    numerator?: FilterableEntry[];
    numeratorColumnKey?: string | null;
    denominator?: number | null;
  },
): AggregateParts {
  if (kind === "percent_of" || kind === "ratio_of") {
    // No column → proportion of rows; with one → proportion of its total.
    const total = (rows: FilterableEntry[], key = columnKey) =>
      key ? numericCells(rows, key).reduce((s, n) => s + n, 0) : rows.length;

    const fixed = proportion?.denominator;
    if (fixed !== undefined) {
      const numerator = total(entries);
      // Nobody to divide by is "—", not a divide-by-zero or a misleading 0.
      if (fixed == null || fixed === 0) {
        return { value: null, numerator, denominator: fixed ?? null };
      }
      const ratio = numerator / fixed;
      return {
        value: kind === "percent_of" ? ratio * 100 : ratio,
        numerator,
        denominator: fixed,
      };
    }

    const subset = proportion?.numerator;
    if (!subset) return NO_PARTS;
    const denominator = total(entries);
    const numerator = total(subset, proportion?.numeratorColumnKey ?? columnKey);
    // An empty population — or a column summing to zero — has no proportion.
    if (denominator === 0) return { value: null, numerator, denominator };
    const ratio = numerator / denominator;
    return {
      value: kind === "percent_of" ? ratio * 100 : ratio,
      numerator,
      denominator,
    };
  }

  if (kind === "count") {
    return { value: entries.length, numerator: entries.length, denominator: null };
  }
  if (!columnKey) return NO_PARTS;

  if (kind === "latest") {
    const withValue = entries.filter((e) => {
      const v = e.values[columnKey];
      return v !== null && v !== undefined && v !== "";
    });
    if (withValue.length === 0) return NO_PARTS;
    // Newest by period, then by insertion order for same-period rows.
    const newest = withValue.reduce((best, e) => {
      const a = periodOrdinal(e.year, e.quarter);
      const b = periodOrdinal(best.year, best.quarter);
      return a > b || (a === b && e.id > best.id) ? e : best;
    });
    const n = Number(newest.values[columnKey]);
    return Number.isFinite(n) ? { value: n, numerator: n, denominator: null } : NO_PARTS;
  }

  const nums = numericCells(entries, columnKey);
  if (nums.length === 0) return NO_PARTS;
  const total = nums.reduce((s, n) => s + n, 0);
  // An average divides the summed column by how many rows carried a number.
  return kind === "avg"
    ? { value: total / nums.length, numerator: total, denominator: nums.length }
    : { value: total, numerator: total, denominator: null };
}

/** The aggregated value alone — see aggregateParts for the semantics. */
export function aggregate(
  kind: AggregationKind,
  columnKey: string | null,
  entries: FilterableEntry[],
  proportion?: {
    numerator?: FilterableEntry[];
    numeratorColumnKey?: string | null;
    denominator?: number | null;
  },
): number | null {
  return aggregateParts(kind, columnKey, entries, proportion).value;
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
    if (!aggregationAllowsColumn(aggregation)) {
      columnKey = null; // count ignores it; don't store a misleading value
    } else if (!columnKey) {
      // Only mandatory for the kinds that have nothing to fall back on; the
      // proportion kinds count rows instead.
      if (aggregationNeedsColumn(aggregation)) {
        throw invalid(`"${AGGREGATION_LABELS[aggregation]}" needs a column to aggregate`);
      }
    } else {
      const col = byKey.get(columnKey);
      if (!col) throw invalid(`Unknown column "${columnKey}"`);
      if (col.dataType !== "number") {
        throw invalid(`"${col.label}" is not a number column, so it cannot be aggregated`);
      }
    }

    const filters = Array.isArray(m?.filters) ? m.filters : [];
    const mapping: DataSourceLinkMapping = {
      slot,
      aggregation,
      columnKey,
      filters: filters.map((f: DataSourceFilter) =>
        validateFilter(byKey, grain, f),
      ),
    };

    const source = (m?.denominatorSource ?? "rows") as DenominatorSource;
    // A stray numerator column is rejected rather than dropped: silently
    // ignoring it would compute a different fraction than the one asked for.
    const strayNumeratorColumn = () => {
      if (m?.numeratorColumnKey) {
        throw invalid(
          `"${AGGREGATION_LABELS[aggregation]}" has no separate numerator to total on its own column`,
        );
      }
    };
    if (!isProportionKind(aggregation)) {
      if (m?.denominatorSource) {
        throw invalid(
          `"${AGGREGATION_LABELS[aggregation]}" has no denominator to choose a source for`,
        );
      }
      strayNumeratorColumn();
    } else if (source === "faculty") {
      // The roster supplies the divisor, so `filters` selects the numerator rows
      // directly and a second list would have nothing to narrow.
      const ranks = Array.isArray(m?.facultyRanks) ? m.facultyRanks : [];
      if (ranks.length === 0) {
        throw invalid("Pick at least one faculty rank to count");
      }
      const unknown = ranks.find((r: string) => !VALID_RANKS.includes(r as Rank));
      if (unknown) throw invalid(`Unknown faculty rank "${unknown}"`);
      // The numerator here is `filters` totalled on columnKey; totalling a
      // different column against the roster is already just that column.
      strayNumeratorColumn();
      mapping.denominatorSource = "faculty";
      mapping.facultyRanks = ranks as Rank[];
    } else if (source === "rows") {
      const asked = m?.numeratorColumnKey?.trim() || null;
      // Repeating the denominator's column is no second quantity at all — drop
      // it, so nothing downstream has to keep explaining a no-op.
      const numeratorColumnKey = asked === columnKey ? null : asked;
      if (numeratorColumnKey) {
        if (!columnKey) {
          throw invalid(
            "A numerator column needs a denominator column to divide by — pick one, or clear it to compare row counts",
          );
        }
        const col = byKey.get(numeratorColumnKey);
        if (!col) throw invalid(`Unknown column "${numeratorColumnKey}"`);
        if (col.dataType !== "number") {
          throw invalid(`"${col.label}" is not a number column, so it cannot be aggregated`);
        }
        mapping.numeratorColumnKey = numeratorColumnKey;
      }

      const raw2 = Array.isArray(m?.numeratorFilters) ? m.numeratorFilters : [];
      // With no numerator condition the numerator IS the population — exactly
      // 100 (or 1) while both sides total the same column, but a real fraction
      // once the top totals a different one.
      if (raw2.length === 0 && !numeratorColumnKey) {
        throw invalid(
          `"${AGGREGATION_LABELS[aggregation]}" needs a numerator column, or at least one condition saying which rows to count`,
        );
      }
      mapping.numeratorFilters = raw2.map((f: DataSourceFilter) =>
        validateFilter(byKey, grain, f),
      );
    } else {
      throw invalid(`Unknown denominator source "${m?.denominatorSource}"`);
    }

    return mapping;
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

  if (operator === "in") {
    const raw = Array.isArray(f.values) ? f.values : [];
    // An empty list would silently match nothing and zero the KPI with no
    // explanation — the worst failure mode here, so reject it outright.
    if (raw.length === 0) {
      throw invalid(`"${column.label}" needs at least one value to match`);
    }
    const seen = new Set<string>();
    const values: DataSourceCellValue[] = [];
    for (const entry of raw) {
      const normalised = normalizeOperand(column, entry, `"${column.label}"`);
      const dedupeKey = String(normalised);
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      values.push(normalised);
    }
    return { field: column.colKey, operator, values };
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

  if (filter.operator === "between") {
    return `${name} ${op} ${show(filter.value)} → ${show(filter.valueTo)}`;
  }
  if (filter.operator === "in") {
    return `${name} ${op} ${(filter.values ?? []).map(show).join(", ")}`;
  }
  return `${name} ${op} ${show(filter.value)}`;
}

/** Human summary of a whole mapping, for the Linked KPIs table. */
export function describeMapping(
  mapping: DataSourceLinkMapping,
  columns: FilterColumnSpec[],
  labels?: Record<string, string>,
): string {
  const labelOf = (key: string | null | undefined) =>
    columns.find((c) => c.colKey === key)?.label ?? key ?? "";
  const list = (fs: DataSourceFilter[]) =>
    fs.map((f) => describeFilter(f, columns, labels)).join(" and ");
  // No column to name → the kind is measuring rows themselves. Two columns name
  // both sides, or the fraction would read as one column's share of itself.
  const head = mapping.numeratorColumnKey
    ? `${AGGREGATION_LABELS[mapping.aggregation]} ${labelOf(mapping.numeratorColumnKey)} out of ${labelOf(mapping.columnKey)}`
    : mapping.columnKey
      ? `${AGGREGATION_LABELS[mapping.aggregation]} ${labelOf(mapping.columnKey)}`
      : mapping.aggregation === "count"
        ? AGGREGATION_LABELS.count
        : `${AGGREGATION_LABELS[mapping.aggregation]} rows`;

  const scoped = mapping.filters.length === 0 ? head : `${head} where ${list(mapping.filters)}`;

  if (mapping.denominatorSource === "faculty") {
    const ranks = mapping.facultyRanks ?? [];
    const excluded = VALID_RANKS.filter((r) => !ranks.includes(r));
    // "excluding X" reads better than relisting four of five ranks.
    const who =
      excluded.length === 0
        ? ""
        : excluded.length < ranks.length
          ? ` (excluding ${excluded.join(", ")})`
          : ` (${ranks.join(", ")} only)`;
    // "current" is load-bearing: the roster has no history, so every period is
    // divided by today's headcount.
    return `${scoped} · per current active faculty member${who}`;
  }

  const numerator = mapping.numeratorFilters ?? [];
  if (numerator.length === 0) return scoped;
  return `${scoped} · counting ${list(numerator)}`;
}
