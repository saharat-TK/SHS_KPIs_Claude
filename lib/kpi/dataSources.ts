import type { Locale } from "@/lib/i18n/config";
import type {
  AcademicCatalog,
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceColumnType,
  DataSourcePeriodGrain,
  Position,
  Role,
} from "@/lib/types";
import {
  CellFormatError,
  FORMAT_EXAMPLE,
  MONTHS,
  formatDateBE,
  monthShortLabel,
  parseDate,
  parseMonth,
  parseYearBE,
} from "./cellFormats.ts";
import { englishT, type Translator } from "../i18n/dictionaries.ts";

export const DATA_SOURCE_COLUMN_TYPES: DataSourceColumnType[] = [
  "text",
  "url",
  "number",
  "date",
  "select",
  "boolean",
  "faculty",
  "program",
  "curriculum",
  "year_be",
  "month",
];

export const COLUMN_TYPE_LABELS: Record<DataSourceColumnType, string> = {
  text: "Text",
  url: "URL",
  number: "Number",
  date: "Date",
  select: "Choice",
  boolean: "Yes / No",
  faculty: "Faculties",
  program: "Programs",
  curriculum: "Curriculums",
  year_be: "Year (BE)",
  month: "Month",
};

/** Types whose allowed values come from elsewhere (the faculty roster, the program
 *  list) rather than from options the admin types. Their `options` column stays NULL;
 *  the server fills the allowed set in before validating, and the UI renders the
 *  choices from a hook or a constant. */
export const DERIVED_OPTION_TYPES: DataSourceColumnType[] = [
  "faculty",
  "program",
  "curriculum",
];

export const isDerivedOptionType = (t: DataSourceColumnType) =>
  DERIVED_OPTION_TYPES.includes(t);

/** Where a derived type's choices come from — shown in the columns editor in place
 *  of the options input. */
export const DERIVED_OPTION_SOURCE: Partial<Record<DataSourceColumnType, string>> = {
  faculty: "Options come from the faculty roster (active staff).",
  program: "Options are the academic programs in the catalog.",
  curriculum: "Options are the curricula in the catalog.",
};

/** Column definition as far as validation cares — lets callers pass either a
 *  full DataSourceColumn or a not-yet-saved draft from the columns editor. */
export type ColumnSpec = Pick<
  DataSourceColumn,
  "colKey" | "label" | "dataType" | "isRequired"
> & { options?: string[] | null };

const COL_KEY_RE = /^[a-z][a-z0-9_]*$/;

/** Only web URLs may be opened from the data table. Keeping this check shared
 * between the write path and renderer prevents unsafe protocols from reaching
 * an anchor tag. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Thrown for user-fixable input problems, so route handlers can answer 400
 *  (and surface the message) rather than mistaking a DB failure for bad input. */
export class DataSourceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataSourceValidationError";
  }
}

const invalid = (message: string) => new DataSourceValidationError(message);

/** The committee position that may maintain its own committee's data source
 *  columns alongside admins. */
export const SECRETARY_POSITION: Position = "Committee and Secretary";

/** Who may manage a data source's setup — its columns and its KPI links —
 *  and on what terms.
 *
 *  - "admin": any source, anything — unchanged from before secretaries could.
 *  - "secretary": a committee-role member whose position on *the source's own
 *    committee* is Committee and Secretary. Same powers as an admin, except:
 *    the columns route refuses a save that breaks a KPI link owned by a
 *    committee they don't sit on, and a new link may only target a KPI or
 *    metric of one of their own committees. Existing links they may edit and
 *    unlink whatever they target.
 *  - null: no access.
 *
 *  The committee app role is required as well as the position, matching
 *  checkEntryWriteAccess: a secretary whose app role is viewer gets nothing.
 *  Pure, so the page (to show the button) and the route (to refuse) agree. */
export function sourceManagerAccess(
  role: Role | null | undefined,
  positionOnSourceCommittee: Position | null | undefined,
): "admin" | "secretary" | null {
  if (role === "admin") return "admin";
  if (role === "committee" && positionOnSourceCommittee === SECRETARY_POSITION) {
    return "secretary";
  }
  return null;
}

/** Whether a KPI or metric may be offered as a new link target. `allowed`
 *  undefined = no restriction (admins). Otherwise the target's own committee
 *  must be one of them; an unassigned target is not. A metric is judged by its
 *  own committee, not its KPI's — the same rule the links route applies. */
export function isAllowedLinkTarget(
  targetCommitteeId: string | null | undefined,
  allowed: string[] | undefined,
): boolean {
  if (!allowed) return true;
  return !!targetCommitteeId && allowed.includes(targetCommitteeId);
}

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
  t: Translator = englishT,
): DataSourceCellValue {
  if (raw === null || raw === undefined || raw === "") return null;

  switch (column.dataType) {
    case "number": {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        throw invalid(t("dataSources.validation.notNumber", { label: column.label }));
      }
      return n;
    }
    case "boolean":
      if (typeof raw === "boolean") return raw;
      if (raw === "true" || raw === 1 || raw === "1") return true;
      if (raw === "false" || raw === 0 || raw === "0") return false;
      throw invalid(t("dataSources.validation.notBoolean", { label: column.label }));
    // Formatted types share their parsing with paste, CSV and the input hints
    // (cellFormats.ts). A date is typed in BE and stored as CE YYYY-MM-DD.
    case "date":
    case "year_be":
    case "month": {
      try {
        if (column.dataType === "year_be") return parseYearBE(raw, t);
        if (column.dataType === "month") return parseMonth(raw, t);
        return parseDate(raw, t);
      } catch (err) {
        if (err instanceof CellFormatError) {
          throw invalid(
            t("dataSources.validation.cellPrefix", { label: column.label, message: err.message }),
          );
        }
        throw err;
      }
    }
    case "url": {
      const s = String(raw).trim();
      if (!isHttpUrl(s)) {
        throw invalid(t("dataSources.validation.notUrl", { label: column.label }));
      }
      return s;
    }
    // faculty/program validate identically to select — the difference is only where
    // `options` came from (resolveColumnOptions fills them server-side).
    case "select":
    case "faculty":
    case "program":
    case "curriculum": {
      const s = String(raw);
      const options = column.options ?? [];
      if (options.length > 0 && !options.includes(s)) {
        // Listing 64 faculty ids helps nobody, so derived types name their source
        // instead of enumerating the allowed values.
        throw invalid(
          isDerivedOptionType(column.dataType)
            ? t("dataSources.validation.notValidChoice", {
                label: column.label,
                value: s,
                source: t(
                  `dataSources.validation.derivedSource.${column.dataType as "faculty" | "program" | "curriculum"}`,
                ),
              })
            : t("dataSources.validation.mustBeOneOf", {
                label: column.label,
                options: options.join(", "),
              }),
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
  opts: { allowIncomplete?: boolean } = {},
  t: Translator = englishT,
): Record<string, DataSourceCellValue> {
  const byKey = new Map(columns.map((c) => [c.colKey, c]));

  for (const key of Object.keys(values)) {
    if (!byKey.has(key)) {
      throw invalid(t("dataSources.validation.unknownColumn", { key }));
    }
  }

  const out: Record<string, DataSourceCellValue> = {};
  for (const column of columns) {
    const value = coerceCellValue(column, values[column.colKey], t);
    if (column.isRequired && value === null && !opts.allowIncomplete) {
      throw invalid(t("dataSources.validation.required", { label: column.label }));
    }
    out[column.colKey] = value;
  }
  return out;
}

/** Parsed cells in the form the API takes them back. The upload preview holds
 *  dates as the stored CE ISO string, but the API validates what a person types:
 *  Buddhist-era DD/MM/BBBB, with a CE year rejected. Sending the CE string back
 *  would be refused, so render each date as BE first. Round-trips through
 *  validateEntryValues. */
export function valuesForSubmit(
  columns: ColumnSpec[],
  values: Record<string, DataSourceCellValue>,
): Record<string, DataSourceCellValue> {
  const out = { ...values };
  for (const column of columns) {
    const value = out[column.colKey];
    if (column.dataType === "date" && typeof value === "string") {
      out[column.colKey] = formatDateBE(value);
    }
  }
  return out;
}

/** Labels of the required columns this entry leaves empty. */
export function missingRequired(
  columns: ColumnSpec[],
  values: Record<string, DataSourceCellValue | undefined>,
): string[] {
  return columns
    .filter((c) => c.isRequired && (values[c.colKey] ?? null) === null)
    .map((c) => c.label);
}

/** True when no required column is empty. Decides the stored `isIncomplete` flag
 *  at write time; reads use the flag, so marking a column Required later never
 *  pulls rows that were recorded before out of a KPI. */
export function isEntryComplete(
  columns: ColumnSpec[],
  values: Record<string, DataSourceCellValue | undefined>,
): boolean {
  return missingRequired(columns, values).length === 0;
}

/** The entries a KPI calculation may use: flagged-incomplete ones are held back
 *  until someone finishes them, so a half-filled import never moves a number. */
export function countableEntries<E extends { isIncomplete?: boolean }>(entries: E[]): E[] {
  return entries.filter((e) => !e.isIncomplete);
}

/** A source's grain decides whether an entry carries a quarter at all.
 *  Returns the quarter to store, or throws when the pair is inconsistent.
 *  The year is Buddhist era, like every performance record's years; a CE year
 *  is rejected with its BE equivalent ("2026 … the BE year is 2569"). */
export function normalizeEntryPeriod(
  grain: DataSourcePeriodGrain,
  year: unknown,
  quarter: unknown,
  t: Translator = englishT,
): { year: number; quarter: number | null } {
  if (year === null || year === undefined || String(year).trim() === "") {
    throw invalid(t("dataSources.validation.yearRequired"));
  }
  let y: number;
  try {
    y = parseYearBE(year, t);
  } catch (err) {
    if (err instanceof CellFormatError) {
      throw invalid(t("dataSources.validation.yearPrefix", { message: err.message }));
    }
    throw err;
  }

  if (grain === "annual") {
    if (quarter !== null && quarter !== undefined && quarter !== "") {
      throw invalid(t("dataSources.validation.annualNoQuarter"));
    }
    return { year: y, quarter: null };
  }

  const q = Number(quarter);
  if (!Number.isInteger(q) || q < 1 || q > 4) {
    throw invalid(t("dataSources.validation.quarterRequired"));
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
  if (column.dataType === "month" && typeof value === "number") return monthShortLabel(value);
  // Stored as CE, read in the Buddhist era.
  if (column.dataType === "date") return formatDateBE(value);

  const raw = String(value);
  return isDerivedOptionType(column.dataType) ? (labels?.[raw] ?? raw) : raw;
}

/** Label for an entry's period, e.g. "2568 Q3" or "2568". Thai reads
 *  "ไตรมาส 3 ปี 2568"; CSV exports and templates keep the English form. */
export function formatEntryPeriod(
  year: number,
  quarter: number | null,
  locale: Locale = "en",
): string {
  if (quarter === null) return String(year);
  return locale === "th" ? `ไตรมาส ${quarter} ปี ${year}` : `${year} Q${quarter}`;
}

/** What a delete confirm calls an entry: the value in its second column (the first
 *  data column after Period), quoted, so "which one?" is answerable — a Period is
 *  shared by many rows. Falls back to the bare period when that cell is empty, the
 *  source has no columns, or the column is a derived option (program, faculty…)
 *  and the caller has no `labels` to turn its id into a name. */
export function describeEntryForConfirm(
  columns: ColumnSpec[],
  entry: { year: number; quarter: number | null; values: Record<string, DataSourceCellValue> },
  labels?: Record<string, string>,
  max = 60,
): string {
  const column = columns[0];
  if (column && (labels || !isDerivedOptionType(column.dataType))) {
    const value = entry.values[column.colKey] ?? null;
    const text = formatCellValue(column, value, labels).replace(/\s+/g, " ").trim();
    if (text && text !== "—") {
      return `"${text.length > max ? `${text.slice(0, max).trimEnd()}…` : text}"`;
    }
  }
  return formatEntryPeriod(entry.year, entry.quarter);
}

/* ------------------------------------------------------------------------- *
 * CSV template + bulk import
 *
 * The download and the upload are two halves of one contract, so they live
 * together: buildEntryTemplateCsv decides what the header row says, and
 * matchTemplateHeaders decides what the header row is allowed to say. Splitting
 * them across modules is how a template and its importer drift apart.
 *
 * Everything here reuses coerceCellValue and normalizeEntryPeriod, which the API
 * also runs — a row that previews clean cannot then fail server-side for a
 * different reason. The one thing this layer adds is *collecting* errors instead
 * of throwing on the first: a 200-row file needs every problem at once.
 * ------------------------------------------------------------------------- */

/** Rows opening with this are documentation, not data — the legend the template
 *  writes and the importer skips. */
export const TEMPLATE_COMMENT = "#";
export const TEMPLATE_YEAR_HEADER = "Year";
export const TEMPLATE_QUARTER_HEADER = "Quarter";
export const TEMPLATE_NOTE_HEADER = "Note";

/** Blank rows left under the header so the file opens ready to type into. */
const TEMPLATE_BLANK_ROWS = 3;

/** One allowed value for a constrained column, as the legend presents it.
 *  `hint` carries extra context — a curriculum's owning program, say. */
export interface TemplateChoice {
  code: string;
  label: string;
  hint?: string;
}

/** Which CSV position holds what, once the header row has been understood. */
export interface TemplateHeaderMap {
  year: number;
  /** null when the file carries no Quarter column. */
  quarter: number | null;
  note: number | null;
  /** colKey -> index in the row. Missing optional columns are simply absent. */
  columns: Record<string, number>;
}

/** A problem with one cell, or with the row as a whole when colKey is null. */
export interface EntryRowError {
  colKey: string | null;
  message: string;
  /** An empty required cell. Unlike every other error this one can be imported
   *  anyway, as an incomplete row that no KPI counts until it is filled in. */
  missing?: true;
}

/** Split a row's errors: `blocking` stop an import outright, `missing` are empty
 *  required cells (importable with a flag). */
export function splitRowErrors(errors: EntryRowError[]): {
  blocking: EntryRowError[];
  missing: EntryRowError[];
} {
  return {
    blocking: errors.filter((e) => !e.missing),
    missing: errors.filter((e) => e.missing),
  };
}

export interface ParsedEntryRow {
  /** 1-based line in the uploaded file, so the user can find it in Excel. */
  lineNumber: number;
  year: number | null;
  quarter: number | null;
  values: Record<string, DataSourceCellValue>;
  note: string | null;
  errors: EntryRowError[];
  /** What the file actually said, kept so the preview can show a rejected cell
   *  as the user typed it rather than as the null it coerced to. */
  raw: Record<string, string>;
  rawPeriod: string;
}

/** CSV escaping, duplicated from lib/csv.ts on purpose: this module may not take
 *  runtime imports (see formatCellValue's note), and a template whose Thai column
 *  label contains a comma must still produce a parseable header row. */
function escapeCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** How a column's accepted input is described in the legend: the type's own name
 *  (COLUMN_TYPE_LABELS, so the legend and the columns editor always agree), then
 *  what to actually type. Constrained types end with a colon — their allowed
 *  values are listed underneath. */
function describeColumnInput(column: ColumnSpec): string {
  switch (column.dataType) {
    case "date":
      return "Format: DD/MM/YYYY in the Buddhist era (BE), e.g. 15/03/2569. Not a CE year.";
    case "year_be":
      return `A 4-digit Buddhist-era (BE) year, ${FORMAT_EXAMPLE.year_be}. Not a CE year.`;
    case "month":
      return "Enter 1–12 (or the month's name):";
    case "url":
      return "Must start with http:// or https://.";
    case "boolean":
      return "Enter true or false.";
    case "select":
      return "Enter one of these values:";
    case "faculty":
      return "Enter one of these ids:";
    case "program":
    case "curriculum":
      return "Enter one of these codes:";
    default:
      return "";
  }
}

/** The CSV a committee downloads, fills in offline, and uploads back.
 *
 *  `choices` arrives resolved (built from the academic catalog and the faculty
 *  roster by the caller) because this module cannot query anything itself. A
 *  column with no entry there simply gets no allowed-value block. */
export function buildEntryTemplateCsv(args: {
  sourceName: string;
  grain: DataSourcePeriodGrain;
  columns: ColumnSpec[];
  choices?: Record<string, TemplateChoice[]>;
}): string {
  const { sourceName, grain, columns, choices = {} } = args;
  const comment = (text: string) => (text ? `${TEMPLATE_COMMENT} ${text}` : TEMPLATE_COMMENT);

  const lines: string[] = [
    comment(`SHS data entry template — ${sourceName}`),
    comment(
      grain === "quarterly"
        ? `Period grain: quarterly — fill both ${TEMPLATE_YEAR_HEADER} (BE, ${FORMAT_EXAMPLE.year_be}) and ${TEMPLATE_QUARTER_HEADER} (1–4).`
        : `Period grain: annual — fill ${TEMPLATE_YEAR_HEADER} only (BE, ${FORMAT_EXAMPLE.year_be}), and leave no ${TEMPLATE_QUARTER_HEADER} column.`,
    ),
    comment("Lines starting with # are ignored on upload. Do not edit the header row."),
    comment(`${TEMPLATE_NOTE_HEADER} is optional and free text.`),
    comment(""),
    comment("Columns:"),
  ];

  for (const column of columns) {
    const type = COLUMN_TYPE_LABELS[column.dataType];
    const required = column.isRequired ? ", required" : "";
    const how = describeColumnInput(column);
    lines.push(
      comment(
        `  ${column.label} [${column.colKey}] — ${type}${required}.${how ? ` ${how}` : ""}`,
      ),
    );
    for (const choice of choices[column.colKey] ?? []) {
      // A `select`'s options are their own label; only derived types have a
      // separate human name worth printing alongside the code.
      const named =
        choice.label && choice.label !== choice.code
          ? `${choice.code} = ${choice.label}`
          : choice.code;
      lines.push(comment(`      ${named}${choice.hint ? ` (${choice.hint})` : ""}`));
    }
  }
  lines.push(comment(""));

  const header = [
    TEMPLATE_YEAR_HEADER,
    ...(grain === "quarterly" ? [TEMPLATE_QUARTER_HEADER] : []),
    ...columns.map((c) => c.label),
    TEMPLATE_NOTE_HEADER,
  ];
  lines.push(header.map(escapeCsvCell).join(","));

  const blank = new Array(header.length).fill("").join(",");
  for (let i = 0; i < TEMPLATE_BLANK_ROWS; i += 1) lines.push(blank);

  return lines.join("\n");
}

/** Client-side mirror of resolveColumnOptions (dataSourcesServer.ts).
 *
 *  A derived-option column arrives from the API with `options: null` — the
 *  allowed set lives in the faculty roster and the academic catalog, and the
 *  server fills it in just before validating. Without the same step here,
 *  coerceCellValue's `options.length > 0` guard silently accepts anything in
 *  those columns, so a bad program code would preview clean and only blow up on
 *  import. The import preview must be given the resolved set, not the raw one. */
export function withResolvedOptions(
  columns: ColumnSpec[],
  choices: Record<string, TemplateChoice[]>,
): ColumnSpec[] {
  return columns.map((c) =>
    isDerivedOptionType(c.dataType)
      ? { ...c, options: (choices[c.colKey] ?? []).map((x) => x.code) }
      : c,
  );
}

/** Every constrained column's allowed values, resolved from the two queries the
 *  entry form's pickers already run.
 *
 *  Three surfaces need this same set and must not disagree about it: the CSV
 *  template's legend (a column that cannot be filled in offline unless the file
 *  says what it accepts), the import preview's validation, and the batch grid's.
 *  Deriving it once here is what keeps a template from offering a code the form
 *  would reject. */
export function buildColumnChoices(
  columns: ColumnSpec[],
  catalog: AcademicCatalog | undefined,
  faculty: { id: string; name: string; program: string; status: string }[],
): Record<string, TemplateChoice[]> {
  const roster = faculty.filter((f) => f.status === "active");
  const out: Record<string, TemplateChoice[]> = {};

  for (const c of columns) {
    if (c.dataType === "select") {
      out[c.colKey] = (c.options ?? []).map((o) => ({ code: o, label: o }));
    } else if (c.dataType === "month") {
      out[c.colKey] = MONTHS.map((m) => ({
        code: String(m.value),
        label: m.en,
        hint: m.thShort,
      }));
    } else if (c.dataType === "program") {
      out[c.colKey] = (catalog?.programs ?? []).map((p) => ({
        code: p.code,
        label: p.label,
      }));
    } else if (c.dataType === "curriculum") {
      out[c.colKey] = (catalog?.curricula ?? []).map((x) => ({
        code: x.code,
        label: x.label,
        hint: x.programCode,
      }));
    } else if (c.dataType === "faculty") {
      // DERIVED_OPTION_SOURCE refuses to list 64 ids in an error message, but
      // someone filling a spreadsheet offline has no other way to find one.
      out[c.colKey] = roster.map((f) => ({
        code: f.id,
        label: f.name,
        hint: f.program,
      }));
    }
  }
  return out;
}

/** Header cells survive a trip through Excel and a human, so compare them
 *  loosely: case, surrounding space, and collapsed inner space all forgiven. */
const normalizeHeader = (cell: string) =>
  cell.trim().replace(/\s+/g, " ").toLowerCase();

/** Work out which CSV position holds which column. Accepts either the label the
 *  template printed or the underlying col_key, so a file that has been through a
 *  rename still lines up. */
export function matchTemplateHeaders(
  header: string[],
  grain: DataSourcePeriodGrain,
  columns: ColumnSpec[],
  t: Translator = englishT,
): { map: TemplateHeaderMap; errors: string[] } {
  const errors: string[] = [];
  const map: TemplateHeaderMap = { year: -1, quarter: null, note: null, columns: {} };

  const byName = new Map<string, ColumnSpec>();
  for (const column of columns) {
    byName.set(normalizeHeader(column.label), column);
    byName.set(normalizeHeader(column.colKey), column);
  }

  header.forEach((cell, index) => {
    const name = normalizeHeader(cell);
    if (name === "") return; // trailing empty cells are Excel's, not the user's

    if (name === normalizeHeader(TEMPLATE_YEAR_HEADER)) {
      map.year = index;
      return;
    }
    if (name === normalizeHeader(TEMPLATE_QUARTER_HEADER)) {
      map.quarter = index;
      return;
    }
    if (name === normalizeHeader(TEMPLATE_NOTE_HEADER)) {
      map.note = index;
      return;
    }

    const column = byName.get(name);
    if (!column) {
      errors.push(t("dataSources.import.headerUnrecognised", { column: cell.trim() }));
      return;
    }
    if (map.columns[column.colKey] !== undefined) {
      errors.push(t("dataSources.import.headerDuplicate", { label: column.label }));
      return;
    }
    map.columns[column.colKey] = index;
  });

  if (map.year === -1) {
    errors.push(t("dataSources.import.headerNeedsYear", { header: TEMPLATE_YEAR_HEADER }));
  }
  if (grain === "quarterly" && map.quarter === null) {
    errors.push(
      t("dataSources.import.headerNeedsQuarter", { header: TEMPLATE_QUARTER_HEADER }),
    );
  }
  // A missing required column is reported once here rather than once per row.
  for (const column of columns) {
    if (column.isRequired && map.columns[column.colKey] === undefined) {
      errors.push(t("dataSources.import.headerMissingRequired", { label: column.label }));
    }
  }

  return { map, errors };
}

/** Spreadsheets spell booleans the way people do. Normalise to what
 *  coerceCellValue accepts rather than loosening the storage contract. */
function normalizeBooleanCell(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s === "yes" || s === "y") return "true";
  if (s === "no" || s === "n") return "false";
  return raw.trim();
}

/** Read one cell, turning a thrown coercion error into a collected one.
 *  For derived types, a value that matches a *label* rather than a code is the
 *  most likely mistake (someone pasted from the Export CSV), so name the code. */
function readCell(
  column: ColumnSpec,
  raw: string,
  labels: Record<string, string> | undefined,
  t: Translator = englishT,
): { value: DataSourceCellValue; error: EntryRowError | null } {
  const trimmed =
    column.dataType === "boolean" ? normalizeBooleanCell(raw) : raw.trim();

  try {
    const value = coerceCellValue(column, trimmed, t);
    if (column.isRequired && value === null) {
      return {
        value: null,
        error: {
          colKey: column.colKey,
          message: t("dataSources.validation.required", { label: column.label }),
          missing: true,
        },
      };
    }
    return { value, error: null };
  } catch (err) {
    let message =
      err instanceof Error
        ? err.message
        : t("dataSources.validation.invalid", { label: column.label });
    if (isDerivedOptionType(column.dataType) && labels) {
      const match = Object.entries(labels).find(([, label]) => label === trimmed);
      if (match) message += t("dataSources.validation.didYouMean", { code: match[0] });
    }
    return { value: null, error: { colKey: column.colKey, message } };
  }
}

/** Coerce every parsed row, collecting all problems instead of throwing on the
 *  first. Rows that are entirely blank are dropped rather than flagged —
 *  spreadsheets pad files with empties and that is not the user's mistake. */
export function collectEntryRows(args: {
  rows: { lineNumber: number; cells: string[] }[];
  map: TemplateHeaderMap;
  grain: DataSourcePeriodGrain;
  columns: ColumnSpec[];
  labels?: Record<string, string>;
  t?: Translator;
}): ParsedEntryRow[] {
  const { rows, map, grain, columns, labels, t = englishT } = args;
  const cellAt = (cells: string[], index: number | null) =>
    index === null || index < 0 ? "" : (cells[index] ?? "");

  const out: ParsedEntryRow[] = [];
  for (const { lineNumber, cells } of rows) {
    if (cells.every((c) => c.trim() === "")) continue;

    const errors: EntryRowError[] = [];
    const values: Record<string, DataSourceCellValue> = {};
    const raw: Record<string, string> = {};

    for (const column of columns) {
      const index = map.columns[column.colKey];
      const cell = cellAt(cells, index === undefined ? null : index);
      const { value, error } = readCell(column, cell, labels, t);
      values[column.colKey] = value;
      raw[column.colKey] = cell.trim();
      if (error) errors.push(error);
    }

    const rawYear = cellAt(cells, map.year).trim();
    const rawQuarter = cellAt(cells, map.quarter).trim();
    let year: number | null = null;
    let quarter: number | null = null;
    try {
      const period = normalizeEntryPeriod(grain, rawYear, rawQuarter, t);
      year = period.year;
      quarter = period.quarter;
    } catch (err) {
      errors.push({
        colKey: null,
        message: err instanceof Error ? err.message : t("dataSources.validation.periodInvalid"),
      });
    }

    out.push({
      lineNumber,
      year,
      quarter,
      values,
      note: cellAt(cells, map.note).trim() || null,
      errors,
      raw,
      rawPeriod: [rawYear, rawQuarter && `Q${rawQuarter}`].filter(Boolean).join(" "),
    });
  }
  return out;
}

/** Read a whole uploaded file: drop the legend, take the first surviving row as
 *  the header, and coerce the rest. Line numbers are kept against the original
 *  file so an error the user sees matches what their editor shows. */
export function readEntryTemplateCsv(args: {
  rows: string[][];
  grain: DataSourcePeriodGrain;
  columns: ColumnSpec[];
  labels?: Record<string, string>;
  t?: Translator;
}): { headerErrors: string[]; rows: ParsedEntryRow[] } {
  const { rows, grain, columns, labels, t = englishT } = args;

  const meaningful = rows
    .map((cells, i) => ({ lineNumber: i + 1, cells }))
    .filter(
      ({ cells }) =>
        !(cells[0] ?? "").trimStart().startsWith(TEMPLATE_COMMENT) &&
        !cells.every((c) => c.trim() === ""),
    );

  if (meaningful.length === 0) {
    return { headerErrors: [t("dataSources.import.noHeaderRow")], rows: [] };
  }

  const [header, ...body] = meaningful;
  const { map, errors } = matchTemplateHeaders(header.cells, grain, columns, t);
  if (errors.length > 0) return { headerErrors: errors, rows: [] };

  return {
    headerErrors: [],
    rows: collectEntryRows({ rows: body, map, grain, columns, labels, t }),
  };
}

/** Identity of a row for duplicate detection: its period plus every stored cell.
 *  `note` is excluded — two rows that differ only by their note are the same
 *  observation annotated twice, which is exactly what we want to warn about. */
export function entryFingerprint(
  columns: ColumnSpec[],
  year: number | null,
  quarter: number | null,
  values: Record<string, DataSourceCellValue>,
): string {
  return JSON.stringify([
    year,
    quarter,
    columns.map((c) => values[c.colKey] ?? null),
  ]);
}
