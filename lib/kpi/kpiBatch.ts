// Batch creation of skeleton library KPIs — the rules shared by the Batch Add
// grid on the set page and the bulk POST that persists it.
//
// A batch row carries just enough to place a KPI in the set: its name, type,
// one category, owning committee, a description and its optional EdPEx topic /
// area / indicator code, and optionally its 5-year and Year 1–5 targets.
// Everything else (calculation, thresholds, variables) is configured afterwards
// in the KPI editor, so rows land with the same defaults as the single-create POST plus
// the weight/unit below.
//
// No runtime imports beyond sibling modules: tests load this file directly
// under node's type-stripping.
import type { KpiCategoryRecord } from "@/lib/types";
import { categoryTaxonomyForKpiType } from "./categories.ts";
import {
  EDPEX_INDICATOR_CODE_MAX,
  findEdpexArea,
  normaliseEdpex,
  resolveEdpexAreaText,
  resolveEdpexTopicText,
  type EdpexCatalog,
} from "./edpex.ts";
import { parseCsv, toCsv, UTF8_BOM } from "../csv.ts";
import { validateAnnualTargets } from "./targets.ts";

/** Ceiling on one batch: the bulk POST builds a single multi-row INSERT. */
export const KPI_BATCH_MAX_ROWS = 500;

/** Weight starts at 0 so a batch of skeletons cannot inflate a total before
 *  anyone has decided the real split; the unit matches the single-create form. */
export const KPI_BATCH_DEFAULTS = { weight: 0, unit: "Item" } as const;

/** One grid row while editing. Every field is a string; "" means unset.
 *  `categoryId` is a single category whose taxonomy follows `kpiType` — it is
 *  stored as category_id or routine_category_id by toKpiCreateInput. */
export interface KpiBatchRow {
  name: string;
  kpiType: string;
  categoryId: string;
  committeeId: string;
  description: string;
  /** EdPEx topic id ("7.1") and area id ("7.1ข"); optional, and the area must
   *  be one of the topic's. */
  edpexTopicId: string;
  edpexAreaId: string;
  /** The KPI's row in the EdPEx SAR ("7.1ข-4"); optional free text that must
   *  start with the area when one is set. */
  edpexIndicatorCode: string;
  /** Optional targets, as typed. The cap rule applies: each year's target must
   *  not exceed the 5-year target (lib/kpi/targets.ts). */
  fiveYearTarget: string;
  targetY1: string;
  targetY2: string;
  targetY3: string;
  targetY4: string;
  targetY5: string;
}

/** The five annual-target fields, in year order. */
export const KPI_BATCH_YEAR_KEYS = [
  "targetY1",
  "targetY2",
  "targetY3",
  "targetY4",
  "targetY5",
] as const;

const TARGET_KEYS = ["fiveYearTarget", ...KPI_BATCH_YEAR_KEYS] as const;

export interface KpiBatchLookups {
  kpiTypes: { id: string; label: string }[];
  categories: Pick<KpiCategoryRecord, "id" | "kpiType" | "label">[];
  committees: { id: string; name: string }[];
  edpex: EdpexCatalog;
}

export interface KpiBatchRowCheck {
  /** Nothing typed in the row — ignored rather than flagged. */
  blank: boolean;
  error: string | null;
  /** Same name as another row in the batch or a KPI already in the set. */
  duplicate: boolean;
}

export interface KpiBatchCheck {
  rows: KpiBatchRowCheck[];
  readyCount: number;
  errorCount: number;
  duplicateCount: number;
}

/** The columns in grid, paste and CSV order. Later additions go last — the
 *  EdPEx pair, then the indicator code — so a shorter paste or file from before
 *  they existed still lines up.
 *  `aliases` are other headers a template upload accepts for the column. */
export const KPI_BATCH_COLUMNS = [
  { key: "name", label: "Name", aliases: ["KPI Name"] },
  { key: "kpiType", label: "Type", aliases: ["KPI Type"] },
  { key: "categoryId", label: "Category", aliases: [] },
  { key: "committeeId", label: "Committee", aliases: [] },
  { key: "description", label: "Description", aliases: [] },
  { key: "edpexTopicId", label: "EdPEx Topic", aliases: ["EdPEx-topic", "EdPEx"] },
  { key: "edpexAreaId", label: "EdPEx Area", aliases: ["EdPEx-area"] },
  {
    key: "edpexIndicatorCode",
    label: "EdPEx Indicator",
    aliases: ["EdPEx Indicator Code", "EdPEx Code", "Indicator Code"],
  },
  {
    key: "fiveYearTarget",
    label: "5-Year Target",
    aliases: ["5-Yr", "5 Yr Target", "Five-Year Target", "5-Year"],
  },
  { key: "targetY1", label: "Target Y1", aliases: ["Y1", "Year 1", "Year 1 Target"] },
  { key: "targetY2", label: "Target Y2", aliases: ["Y2", "Year 2", "Year 2 Target"] },
  { key: "targetY3", label: "Target Y3", aliases: ["Y3", "Year 3", "Year 3 Target"] },
  { key: "targetY4", label: "Target Y4", aliases: ["Y4", "Year 4", "Year 4 Target"] },
  { key: "targetY5", label: "Target Y5", aliases: ["Y5", "Year 5", "Year 5 Target"] },
] as const satisfies readonly {
  key: keyof KpiBatchRow;
  label: string;
  aliases: readonly string[];
}[];

/** A column's header, with the set's B.E. year on each annual-target column
 *  ("Target Y1 (2565)") when the start year is known. The reader ignores a
 *  trailing "(…)", so either form imports. */
export function kpiBatchColumnLabel(
  column: (typeof KPI_BATCH_COLUMNS)[number],
  startYear?: number,
): string {
  const yearNo = (KPI_BATCH_YEAR_KEYS as readonly string[]).indexOf(column.key) + 1;
  return yearNo > 0 && startYear ? `${column.label} (${startYear + yearNo - 1})` : column.label;
}

export function emptyKpiBatchRow(defaults: Partial<KpiBatchRow> = {}): KpiBatchRow {
  return {
    name: "",
    kpiType: "",
    categoryId: "",
    committeeId: "",
    description: "",
    edpexTopicId: "",
    edpexAreaId: "",
    edpexIndicatorCode: "",
    fiveYearTarget: "",
    targetY1: "",
    targetY2: "",
    targetY3: "",
    targetY4: "",
    targetY5: "",
    ...defaults,
  };
}

/** Coerce whatever arrived (JSON body, parsed cells) into a string row. */
export function normalizeKpiBatchRow(raw: unknown): KpiBatchRow {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
  return {
    name: str(r.name),
    kpiType: str(r.kpiType),
    categoryId: str(r.categoryId),
    committeeId: str(r.committeeId),
    description: str(r.description),
    edpexTopicId: str(r.edpexTopicId),
    edpexAreaId: str(r.edpexAreaId),
    edpexIndicatorCode: str(r.edpexIndicatorCode),
    fiveYearTarget: str(r.fiveYearTarget),
    targetY1: str(r.targetY1),
    targetY2: str(r.targetY2),
    targetY3: str(r.targetY3),
    targetY4: str(r.targetY4),
    targetY5: str(r.targetY5),
  };
}

/** Type and committee are pre-filled on new rows, and the EdPEx pair can be
 *  filled down a whole column, so none of them make a row "touched" — only the
 *  fields a person actually types do (the indicator code is one of those). */
export function isBlankKpiBatchRow(row: KpiBatchRow): boolean {
  return (
    !row.name.trim() &&
    !row.description.trim() &&
    !row.categoryId.trim() &&
    !row.edpexIndicatorCode.trim() &&
    TARGET_KEYS.every((k) => !row[k].trim())
  );
}

/** A typed target as a number: "" is null, NaN means it isn't a number.
 *  Thousands separators ("1,250") and spaces are allowed. */
export function parseKpiTarget(text: string): number | null {
  const t = text.trim().replace(/[,\s]/g, "");
  if (!t) return null;
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : NaN;
}

/** The row's targets, or the first one that is not a number. */
function rowTargets(row: KpiBatchRow):
  | { ok: true; fiveYearTarget: number | null; years: { yearNo: number; targetValue: number | null }[] }
  | { ok: false; error: string } {
  const fiveYearTarget = parseKpiTarget(row.fiveYearTarget);
  if (Number.isNaN(fiveYearTarget)) return { ok: false, error: "5-Year Target must be a number" };
  const years = [];
  for (const [i, key] of KPI_BATCH_YEAR_KEYS.entries()) {
    const targetValue = parseKpiTarget(row[key]);
    if (Number.isNaN(targetValue)) {
      return { ok: false, error: `Year ${i + 1} target must be a number` };
    }
    years.push({ yearNo: i + 1, targetValue });
  }
  return { ok: true, fiveYearTarget, years };
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase();

/** Key for duplicate detection: case- and whitespace-insensitive. */
export const kpiNameKey = norm;

/** A category is valid for a row when its taxonomy matches the row's type. */
export function categoriesForKpiType<T extends Pick<KpiCategoryRecord, "kpiType">>(
  categories: T[],
  kpiType: string,
): T[] {
  const taxonomy = categoryTaxonomyForKpiType(kpiType);
  return categories.filter((c) => c.kpiType === taxonomy);
}

/** First problem with a non-blank row, or null. */
export function kpiBatchRowError(
  row: KpiBatchRow,
  lookups: KpiBatchLookups,
): string | null {
  const name = row.name.trim();
  if (name.length < 2) return "Name must be at least 2 characters";
  if (name.length > 500) return "Name is longer than 500 characters";

  const type = lookups.kpiTypes.find((t) => t.id === row.kpiType);
  if (!type) {
    return row.kpiType.trim() ? `Unknown KPI type "${row.kpiType}"` : "Choose a KPI type";
  }

  if (row.categoryId) {
    const category = lookups.categories.find((c) => c.id === row.categoryId);
    if (!category) return `Unknown category "${row.categoryId}"`;
    const taxonomy = categoryTaxonomyForKpiType(type.id);
    if (category.kpiType !== taxonomy) {
      return `"${category.label}" is not a ${taxonomy === "routine" ? "Routine" : "Strategic"} category, which ${type.label} KPIs use`;
    }
  }

  if (row.committeeId && !lookups.committees.some((c) => c.id === row.committeeId)) {
    return `Unknown committee "${row.committeeId}"`;
  }

  const edpex = normaliseEdpex(row, lookups.edpex);
  if (!edpex.ok) return edpex.error;

  const targets = rowTargets(row);
  if (!targets.ok) return targets.error;
  if (targets.fiveYearTarget != null && targets.fiveYearTarget < 0) {
    return "5-Year Target cannot be negative";
  }
  const cap = validateAnnualTargets(targets.fiveYearTarget, targets.years);
  if (!cap.ok) return cap.error;
  return null;
}

/** Validate the whole grid. Duplicates are a warning only — two KPIs may
 *  legitimately share a name across types — so they never block creation. */
export function checkKpiBatch(
  rows: KpiBatchRow[],
  lookups: KpiBatchLookups,
  existingNames: string[] = [],
): KpiBatchCheck {
  const seen = new Map<string, number>();
  for (const name of existingNames) seen.set(kpiNameKey(name), 1);
  for (const row of rows) {
    if (isBlankKpiBatchRow(row)) continue;
    const key = kpiNameKey(row.name);
    if (key) seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  const checks = rows.map((row): KpiBatchRowCheck => {
    if (isBlankKpiBatchRow(row)) return { blank: true, error: null, duplicate: false };
    const key = kpiNameKey(row.name);
    return {
      blank: false,
      error: kpiBatchRowError(row, lookups),
      duplicate: key !== "" && (seen.get(key) ?? 0) > 1,
    };
  });

  const live = checks.filter((c) => !c.blank);
  return {
    rows: checks,
    readyCount: live.filter((c) => !c.error).length,
    errorCount: live.filter((c) => c.error).length,
    duplicateCount: live.filter((c) => c.duplicate).length,
  };
}

/** The library_kpi fields a batch row writes. The row's single category goes
 *  to the column its type groups by; the other taxonomy stays empty. With the
 *  lookups, an EdPEx area given alone also fills in its topic. */
export function toKpiCreateInput(row: KpiBatchRow, lookups?: Pick<KpiBatchLookups, "edpex">) {
  const categoryId = row.categoryId.trim() || null;
  const routine = categoryTaxonomyForKpiType(row.kpiType) === "routine";
  const raw = {
    edpexTopicId: row.edpexTopicId.trim() || null,
    edpexAreaId: row.edpexAreaId.trim() || null,
    edpexIndicatorCode: row.edpexIndicatorCode.trim() || null,
  };
  const edpex = lookups ? normaliseEdpex(raw, lookups.edpex) : null;
  // Callers validate first (kpiBatchRowError); a non-number here is dropped.
  const targets = rowTargets(row);
  const fiveYearTarget = targets.ok ? targets.fiveYearTarget : null;
  const annualTargets = targets.ok
    ? targets.years.filter((t): t is { yearNo: number; targetValue: number } => t.targetValue != null)
    : [];
  return {
    ...(edpex?.ok ? edpex.value : raw),
    name: row.name.trim(),
    description: row.description.trim() || null,
    kpiType: row.kpiType,
    categoryId: routine ? null : categoryId,
    routineCategoryId: routine ? categoryId : null,
    committeeId: row.committeeId.trim() || null,
    weight: KPI_BATCH_DEFAULTS.weight,
    unit: KPI_BATCH_DEFAULTS.unit,
    fiveYearTarget,
    /** Only the years that were filled. */
    annualTargets,
  };
}

// ── Reading typed text (paste, CSV) ─────────────────────────────────────────
// People type what they see — "Routine", "ด้านที่ 3-…", a committee's name —
// so each reference resolves by id or label, case-insensitively. Text that
// matches nothing is kept verbatim so the grid shows it with an error instead
// of silently dropping it.

export function resolveKpiTypeText(text: string, lookups: KpiBatchLookups): string {
  const t = norm(text);
  if (!t) return "";
  return (
    lookups.kpiTypes.find((k) => norm(k.id) === t || norm(k.label) === t)?.id ??
    text.trim()
  );
}

/** Prefers a category in the row's own taxonomy, so a label present in both
 *  resolves to the one that is valid for the row. */
export function resolveCategoryText(
  text: string,
  kpiType: string,
  lookups: KpiBatchLookups,
): string {
  const t = norm(text);
  if (!t) return "";
  const matches = lookups.categories.filter(
    (c) => norm(c.id) === t || norm(c.label) === t,
  );
  const taxonomy = categoryTaxonomyForKpiType(kpiType);
  return (matches.find((c) => c.kpiType === taxonomy) ?? matches[0])?.id ?? text.trim();
}

export function resolveCommitteeText(text: string, lookups: KpiBatchLookups): string {
  const t = norm(text);
  if (!t) return "";
  return (
    lookups.committees.find((c) => norm(c.id) === t || norm(c.name) === t)?.id ??
    text.trim()
  );
}

/** Build a row from cells in KPI_BATCH_COLUMNS order. Empty type/committee
 *  cells take the defaults (the page's current type and committee filter).
 *  An EdPEx area typed without a topic fills the topic in from the area. */
export function kpiBatchRowFromCells(
  cells: string[],
  lookups: KpiBatchLookups,
  defaults: Partial<KpiBatchRow> = {},
): KpiBatchRow {
  const [
    name = "",
    type = "",
    category = "",
    committee = "",
    description = "",
    topic = "",
    area = "",
    indicatorCode = "",
    ...targetCells
  ] = cells;
  const kpiType = resolveKpiTypeText(type, lookups) || defaults.kpiType || "";
  let edpexTopicId = resolveEdpexTopicText(topic, lookups.edpex);
  const edpexAreaId = resolveEdpexAreaText(area, edpexTopicId, lookups.edpex);
  if (!edpexTopicId) edpexTopicId = findEdpexArea(lookups.edpex, edpexAreaId)?.topicId ?? "";
  return {
    name: name.trim(),
    kpiType,
    categoryId: resolveCategoryText(category, kpiType, lookups),
    committeeId: resolveCommitteeText(committee, lookups) || defaults.committeeId || "",
    description: description.trim(),
    edpexTopicId,
    edpexAreaId,
    edpexIndicatorCode: indicatorCode.trim(),
    fiveYearTarget: (targetCells[0] ?? "").trim(),
    targetY1: (targetCells[1] ?? "").trim(),
    targetY2: (targetCells[2] ?? "").trim(),
    targetY3: (targetCells[3] ?? "").trim(),
    targetY4: (targetCells[4] ?? "").trim(),
    targetY5: (targetCells[5] ?? "").trim(),
  };
}

/** Template lines starting with this are instructions, skipped on read. */
export const KPI_TEMPLATE_COMMENT = "#";

/** The template ships a few completed rows to copy from. Their names start
 *  with this marker, and any row whose name does is skipped on upload and
 *  paste — so an example left in the file is never created as a KPI. */
export const KPI_TEMPLATE_EXAMPLE_PREFIX = "[Example]";

export function isKpiTemplateExample(name: string): boolean {
  return name
    .trimStart()
    .toLocaleLowerCase()
    .startsWith(KPI_TEMPLATE_EXAMPLE_PREFIX.toLocaleLowerCase());
}

const isCommentLine = (cells: string[]) =>
  (cells[0] ?? "").trimStart().startsWith(KPI_TEMPLATE_COMMENT);

/** Header matching ignores case, spaces, hyphens and underscores, and accepts
 *  a column's label, key or any alias — "EdPEx-topic", "edpex_topic_id"… A
 *  trailing "(…)" is ignored too, so "Target Y1 (2565)" matches "Target Y1". */
const headerKey = (s: string) =>
  norm(s.replace(/\([^)]*\)\s*$/, "")).replace(/[\s_-]+/g, "");
const columnHeaders = (c: (typeof KPI_BATCH_COLUMNS)[number]) =>
  [c.label, c.key, ...c.aliases].map(headerKey);

const isHeaderCell = (cell: string | undefined) =>
  columnHeaders(KPI_BATCH_COLUMNS[0]).includes(headerKey(cell ?? ""));

/** Rows copied out of Excel (tab-separated). A header row, if one was copied
 *  along, is skipped, as are template instruction lines and empty lines. */
export function parseKpiPaste(
  text: string,
  lookups: KpiBatchLookups,
  defaults: Partial<KpiBatchRow> = {},
): KpiBatchRow[] {
  const lines = parseCsv(text, "\t").filter(
    (cells) => cells.some((c) => c.trim()) && !isCommentLine(cells),
  );
  if (lines.length > 0 && isHeaderCell(lines[0][0])) lines.shift();
  return lines
    .map((cells) => kpiBatchRowFromCells(cells, lookups, defaults))
    .filter((row) => !isKpiTemplateExample(row.name));
}

/**
 * The downloadable template: an instruction block — every column, whether it
 * is required, and the values it accepts, listed from the live lookups — then
 * the header row. Instruction lines start with "#" and are skipped on upload,
 * so the file goes back in exactly as downloaded. Each instruction line is one
 * quoted cell, so commas in a name never spill it across columns in Excel.
 */
export function buildKpiTemplateCsv(
  lookups: KpiBatchLookups,
  setName?: string,
  startYear?: number,
): string {
  const lines: string[] = [];
  const note = (text = "") => lines.push(toCsv([`${KPI_TEMPLATE_COMMENT} ${text}`.trimEnd()], []));

  note(`SHS Batch Add KPIs template${setName ? ` — ${setName}` : ""}`);
  note("Lines starting with # are instructions and are ignored on upload. Keep the header row.");
  note("One KPI per row. Each value may be typed as its code or its full name.");
  note("Every KPI is created as a draft; configure calculation and sub-KPIs afterwards in the KPI editor.");
  note();
  note("Columns:");

  note("  Name — required. Free text, 2–500 characters.");

  note("  Type — required. One of:");
  for (const t of lookups.kpiTypes) note(`      ${t.id} = ${t.label}`);

  note("  Category — optional. Must belong to the taxonomy of the row's Type:");
  const taxonomies = [...new Set(lookups.kpiTypes.map((t) => categoryTaxonomyForKpiType(t.id)))];
  for (const taxonomy of taxonomies) {
    const types = lookups.kpiTypes
      .filter((t) => categoryTaxonomyForKpiType(t.id) === taxonomy)
      .map((t) => t.label)
      .join(" / ");
    note(`    For ${types} KPIs:`);
    const mine = lookups.categories.filter((c) => c.kpiType === taxonomy);
    if (mine.length === 0) note("      (none defined in this set)");
    for (const c of mine) note(`      ${c.id} = ${c.label}`);
  }

  note("  Committee — optional. One of:");
  for (const c of lookups.committees) note(`      ${c.id} = ${c.name}`);

  note("  Description — optional. Free text.");

  note("  EdPEx Topic — optional. The EdPEx Category 7 results item. One of:");
  for (const t of lookups.edpex) note(`      ${t.id} = ${t.name}`);

  note("  EdPEx Area — optional. Must be an area of the row's EdPEx Topic.");
  note("    Type the full code (7.1ข), or just the letter (ข) when EdPEx Topic is filled.");
  note("    An area given without a topic fills the topic in automatically.");
  for (const t of lookups.edpex) {
    if (t.areas.length === 0) continue;
    note(`    Topic ${t.id}:`);
    for (const a of t.areas) note(`      ${a.id} = ${a.name}`);
  }

  note("  EdPEx Indicator — optional. The KPI's numbered row in the EdPEx SAR, e.g. 7.1ข-4.");
  note(`    Free text, up to ${EDPEX_INDICATOR_CODE_MAX} characters. When EdPEx Area is filled it must start with that area (7.1ข-…).`);

  note("  5-Year Target — optional. A number.");
  note(
    `  Target Y1 … Target Y5 — optional. A number for each year of the set${startYear ? ` (Y1 = ${startYear} … Y5 = ${startYear + 4})` : ""}.`,
  );
  note("    Targets are optional; each year's target must not exceed the 5-Year Target.");

  note();
  note(
    `The rows under the header whose Name starts with ${KPI_TEMPLATE_EXAMPLE_PREFIX} are completed examples.`,
  );
  note("They are skipped on upload, so you can leave them, overwrite them, or delete them.");
  note();

  lines.push(toCsv(KPI_BATCH_COLUMNS.map((c) => kpiBatchColumnLabel(c, startYear)), []));
  for (const row of kpiTemplateExampleRows(lookups)) lines.push(toCsv(row, []));
  return UTF8_BOM + lines.join("\n") + "\n";
}

/**
 * Completed example rows for the template, in KPI_BATCH_COLUMNS order, built
 * from the set's own lookups so every value is one the upload accepts. Values
 * are the readable labels a person would type. One example per KPI type the
 * set offers (up to three), each with a category from that type's taxonomy.
 */
export function kpiTemplateExampleRows(lookups: KpiBatchLookups): string[][] {
  const descriptions = [
    "Share of graduates employed within one year of graduation.",
    "Number of programmes reviewed and improved during the year.",
    "Number of academic service projects delivered to the community.",
  ];
  const names = [
    "Graduate employment rate",
    "Programmes improved",
    "Academic service projects",
  ];
  const area = lookups.edpex.find((t) => t.areas.length > 0)?.areas[0];
  // 5-Year Target, then Y1–Y5. The last example leaves them blank: optional.
  const targets = [
    ["90", "70", "75", "80", "85", "90"],
    ["10", "2", "4", "6", "8", "10"],
    ["", "", "", "", "", ""],
  ];

  return lookups.kpiTypes.slice(0, 3).map((type, i) => {
    const taxonomy = categoryTaxonomyForKpiType(type.id);
    const category = lookups.categories.filter((c) => c.kpiType === taxonomy)[0];
    const committee = lookups.committees[i % Math.max(lookups.committees.length, 1)];
    // EdPEx is optional: show it filled on the first example, blank after.
    const withEdpex = i === 0 && area;
    return [
      `${KPI_TEMPLATE_EXAMPLE_PREFIX} ${names[i]}`,
      type.label,
      category?.label ?? "",
      committee?.name ?? "",
      descriptions[i],
      withEdpex ? area.topicId : "",
      withEdpex ? area.id : "",
      withEdpex ? `${area.id}-1` : "",
      ...targets[i],
    ];
  });
}

/** Read a filled-in template. Instruction (#) lines are skipped and columns are
 *  matched by header, so they may be reordered or omitted — only Name is
 *  required, and a file from before the EdPEx columns still imports. */
export function readKpiTemplateCsv(
  text: string,
  lookups: KpiBatchLookups,
  defaults: Partial<KpiBatchRow> = {},
): KpiBatchRow[] {
  const lines = parseCsv(text).filter(
    (cells) => cells.some((c) => c.trim()) && !isCommentLine(cells),
  );
  if (lines.length === 0) throw new Error("The file is empty");

  const header = lines[0].map(headerKey);
  const positions = KPI_BATCH_COLUMNS.map((c) => {
    const names = columnHeaders(c);
    return header.findIndex((h) => names.includes(h));
  });
  if (positions[0] < 0) {
    throw new Error('The file needs a "Name" column — start from the downloaded template');
  }

  return lines
    .slice(1)
    .map((cells) =>
      kpiBatchRowFromCells(
        positions.map((p) => (p >= 0 ? cells[p] ?? "" : "")),
        lookups,
        defaults,
      ),
    )
    .filter((row) => !isBlankKpiBatchRow(row) && !isKpiTemplateExample(row.name));
}
