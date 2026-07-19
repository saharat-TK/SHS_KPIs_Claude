import type {
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceColumnType,
  DataSourcePeriodGrain,
} from "@/lib/types";

export const DATA_SOURCE_COLUMN_TYPES: DataSourceColumnType[] = [
  "text",
  "number",
  "date",
  "select",
  "boolean",
  "faculty",
  "program",
];

export const COLUMN_TYPE_LABELS: Record<DataSourceColumnType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Choice",
  boolean: "Yes / No",
  faculty: "Faculties",
  program: "5 Programs",
};

/** Types whose allowed values come from elsewhere (the faculty roster, the program
 *  list) rather than from options the admin types. Their `options` column stays NULL;
 *  the server fills the allowed set in before validating, and the UI renders the
 *  choices from a hook or a constant. */
export const DERIVED_OPTION_TYPES: DataSourceColumnType[] = ["faculty", "program"];

export const isDerivedOptionType = (t: DataSourceColumnType) =>
  DERIVED_OPTION_TYPES.includes(t);

/** Where a derived type's choices come from — shown in the columns editor in place
 *  of the options input. */
export const DERIVED_OPTION_SOURCE: Partial<Record<DataSourceColumnType, string>> = {
  faculty: "Options come from the faculty roster (active staff).",
  program: "Options are the five academic programs.",
};

/** Column definition as far as validation cares — lets callers pass either a
 *  full DataSourceColumn or a not-yet-saved draft from the columns editor. */
export type ColumnSpec = Pick<
  DataSourceColumn,
  "colKey" | "label" | "dataType" | "isRequired"
> & { options?: string[] | null };

const COL_KEY_RE = /^[a-z][a-z0-9_]*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Thrown for user-fixable input problems, so route handlers can answer 400
 *  (and surface the message) rather than mistaking a DB failure for bad input. */
export class DataSourceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataSourceValidationError";
  }
}

const invalid = (message: string) => new DataSourceValidationError(message);

/** Slugify a column label into a stable col_key. Mirrors the `slugify` in
 *  scripts/migrate-kpi-categories-set-scope.mjs, but also guarantees the
 *  leading-letter rule that COL_KEY_RE enforces. */
export function slugifyColumnKey(label: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  if (!base) return "column";
  return COL_KEY_RE.test(base) ? base : `c_${base}`.slice(0, 40);
}

/** Make `key` unique against `taken` by appending _2, _3, … (stays <= 40 chars). */
export function uniqueColumnKey(key: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(key)) return key;
  for (let n = 2; ; n += 1) {
    const suffix = `_${n}`;
    const candidate = `${key.slice(0, 40 - suffix.length)}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
}

/** Coerce one raw cell value to its column's storage type.
 *  Returns null for empty input; throws on values the type can't represent. */
export function coerceCellValue(
  column: ColumnSpec,
  raw: unknown,
): DataSourceCellValue {
  if (raw === null || raw === undefined || raw === "") return null;

  switch (column.dataType) {
    case "number": {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        throw invalid(`"${column.label}" must be a number`);
      }
      return n;
    }
    case "boolean":
      if (typeof raw === "boolean") return raw;
      if (raw === "true" || raw === 1 || raw === "1") return true;
      if (raw === "false" || raw === 0 || raw === "0") return false;
      throw invalid(`"${column.label}" must be true or false`);
    case "date": {
      const s = String(raw);
      if (!ISO_DATE_RE.test(s) || Number.isNaN(Date.parse(s))) {
        throw invalid(`"${column.label}" must be a date (YYYY-MM-DD)`);
      }
      return s;
    }
    // faculty/program validate identically to select — the difference is only where
    // `options` came from (resolveColumnOptions fills them server-side).
    case "select":
    case "faculty":
    case "program": {
      const s = String(raw);
      const options = column.options ?? [];
      if (options.length > 0 && !options.includes(s)) {
        // Listing 64 faculty ids helps nobody, so derived types name their source
        // instead of enumerating the allowed values.
        throw invalid(
          isDerivedOptionType(column.dataType)
            ? `"${column.label}": "${s}" is not a valid choice. ${DERIVED_OPTION_SOURCE[column.dataType]}`
            : `"${column.label}" must be one of: ${options.join(", ")}`,
        );
      }
      return s;
    }
    default:
      return String(raw);
  }
}

/** Validate + coerce a whole entry row against a source's column definitions.
 *  Rejects unknown keys and missing required values. Throws on the first
 *  problem, so the API can surface the message straight to a toast. */
export function validateEntryValues(
  columns: ColumnSpec[],
  values: Record<string, unknown>,
): Record<string, DataSourceCellValue> {
  const byKey = new Map(columns.map((c) => [c.colKey, c]));

  for (const key of Object.keys(values)) {
    if (!byKey.has(key)) {
      throw invalid(`Unknown column "${key}"`);
    }
  }

  const out: Record<string, DataSourceCellValue> = {};
  for (const column of columns) {
    const value = coerceCellValue(column, values[column.colKey]);
    if (column.isRequired && value === null) {
      throw invalid(`"${column.label}" is required`);
    }
    out[column.colKey] = value;
  }
  return out;
}

/** A source's grain decides whether an entry carries a quarter at all.
 *  Returns the quarter to store, or throws when the pair is inconsistent. */
export function normalizeEntryPeriod(
  grain: DataSourcePeriodGrain,
  year: unknown,
  quarter: unknown,
): { year: number; quarter: number | null } {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 1900 || y > 3000) {
    throw invalid("A valid year is required");
  }

  if (grain === "annual") {
    if (quarter !== null && quarter !== undefined && quarter !== "") {
      throw invalid("An annual data source does not take a quarter");
    }
    return { year: y, quarter: null };
  }

  const q = Number(quarter);
  if (!Number.isInteger(q) || q < 1 || q > 4) {
    throw invalid("A quarter between 1 and 4 is required");
  }
  return { year: y, quarter: q };
}

/** Format a stored cell for display in a table or CSV export.
 *
 *  Derived types store a code (a faculty id, a program abbr); `labels` maps those
 *  codes to human text — build it with buildCellLabels(). A lookup miss falls back
 *  to the raw stored value, never "—", so a faculty member leaving the roster does
 *  not make historical rows unreadable (the same instinct as personsForCommittee
 *  keeping a stale selection rather than dropping it).
 *
 *  This module stays free of runtime imports so tests can load it directly under
 *  node's type-stripping, which is why the labels arrive as an argument. */
export function formatCellValue(
  column: ColumnSpec,
  value: DataSourceCellValue,
  labels?: Record<string, string>,
): string {
  if (value === null || value === undefined) return "—";
  if (column.dataType === "boolean") return value ? "Yes" : "No";

  const raw = String(value);
  return isDerivedOptionType(column.dataType) ? (labels?.[raw] ?? raw) : raw;
}

/** Label for an entry's period, e.g. "2568 Q3" or "2568". */
export function formatEntryPeriod(year: number, quarter: number | null): string {
  return quarter === null ? String(year) : `${year} Q${quarter}`;
}
