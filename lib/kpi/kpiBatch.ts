// Batch creation of skeleton library KPIs — the rules shared by the Batch Add
// grid on the set page and the bulk POST that persists it.
//
// A batch row carries just enough to place a KPI in the set: its name, type,
// one category, owning committee and a description. Everything else (targets,
// calculation, thresholds, variables) is configured afterwards in the KPI
// editor, so rows land with the same defaults as the single-create POST plus
// the weight/unit below.
//
// No runtime imports beyond sibling modules: tests load this file directly
// under node's type-stripping.
import type { KpiCategoryRecord } from "@/lib/types";
import { categoryTaxonomyForKpiType } from "./categories.ts";
import { parseCsv, toCsv, UTF8_BOM } from "../csv.ts";

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
}

export interface KpiBatchLookups {
  kpiTypes: { id: string; label: string }[];
  categories: Pick<KpiCategoryRecord, "id" | "kpiType" | "label">[];
  committees: { id: string; name: string }[];
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

/** The columns in grid, paste and CSV order. */
export const KPI_BATCH_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "kpiType", label: "Type" },
  { key: "categoryId", label: "Category" },
  { key: "committeeId", label: "Committee" },
  { key: "description", label: "Description" },
] as const satisfies readonly { key: keyof KpiBatchRow; label: string }[];

export function emptyKpiBatchRow(defaults: Partial<KpiBatchRow> = {}): KpiBatchRow {
  return {
    name: "",
    kpiType: "",
    categoryId: "",
    committeeId: "",
    description: "",
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
  };
}

/** Type and committee are pre-filled on new rows, so they do not make a row
 *  "touched" — only the fields a person actually types do. */
export function isBlankKpiBatchRow(row: KpiBatchRow): boolean {
  return !row.name.trim() && !row.description.trim() && !row.categoryId.trim();
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
 *  to the column its type groups by; the other taxonomy stays empty. */
export function toKpiCreateInput(row: KpiBatchRow) {
  const categoryId = row.categoryId.trim() || null;
  const routine = categoryTaxonomyForKpiType(row.kpiType) === "routine";
  return {
    name: row.name.trim(),
    description: row.description.trim() || null,
    kpiType: row.kpiType,
    categoryId: routine ? null : categoryId,
    routineCategoryId: routine ? categoryId : null,
    committeeId: row.committeeId.trim() || null,
    weight: KPI_BATCH_DEFAULTS.weight,
    unit: KPI_BATCH_DEFAULTS.unit,
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
 *  cells take the defaults (the page's current type and committee filter). */
export function kpiBatchRowFromCells(
  cells: string[],
  lookups: KpiBatchLookups,
  defaults: Partial<KpiBatchRow> = {},
): KpiBatchRow {
  const [name = "", type = "", category = "", committee = "", description = ""] = cells;
  const kpiType = resolveKpiTypeText(type, lookups) || defaults.kpiType || "";
  return {
    name: name.trim(),
    kpiType,
    categoryId: resolveCategoryText(category, kpiType, lookups),
    committeeId: resolveCommitteeText(committee, lookups) || defaults.committeeId || "",
    description: description.trim(),
  };
}

const isHeaderCell = (cell: string | undefined) =>
  ["name", "kpi name"].includes(norm(cell ?? ""));

/** Rows copied out of Excel (tab-separated). A header row, if one was copied
 *  along, is skipped; fully empty lines are dropped. */
export function parseKpiPaste(
  text: string,
  lookups: KpiBatchLookups,
  defaults: Partial<KpiBatchRow> = {},
): KpiBatchRow[] {
  const lines = parseCsv(text, "\t").filter((cells) => cells.some((c) => c.trim()));
  if (lines.length > 0 && isHeaderCell(lines[0][0])) lines.shift();
  return lines.map((cells) => kpiBatchRowFromCells(cells, lookups, defaults));
}

export function buildKpiTemplateCsv(): string {
  return UTF8_BOM + toCsv(KPI_BATCH_COLUMNS.map((c) => c.label), []) + "\n";
}

/** Read a filled-in template. Columns are matched by header, so they may be
 *  reordered or omitted — only Name is required. */
export function readKpiTemplateCsv(
  text: string,
  lookups: KpiBatchLookups,
  defaults: Partial<KpiBatchRow> = {},
): KpiBatchRow[] {
  const lines = parseCsv(text).filter((cells) => cells.some((c) => c.trim()));
  if (lines.length === 0) throw new Error("The file is empty");

  const header = lines[0].map(norm);
  const indexOf = (label: string) => header.indexOf(norm(label));
  const positions = KPI_BATCH_COLUMNS.map((c) =>
    c.key === "name" ? Math.max(indexOf("Name"), indexOf("KPI Name")) : indexOf(c.label),
  );
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
    .filter((row) => !isBlankKpiBatchRow(row));
}
