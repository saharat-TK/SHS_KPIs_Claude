// Batch data entry — pre-building one entry row per academic program or per
// curriculum, so a source that collects the same measure across the faculty is
// filled in once rather than five or nine times.
//
// Like dataSources.ts and dataSourceFilters.ts this file takes its data as
// arguments and imports only types, so the tests can load it under node's type
// stripping. Nothing here hardcodes a program or a curriculum: the rows come
// from the academic catalog, the same tables the pickers read.
import type { AcademicCatalog, DataSourceCellValue } from "@/lib/types";
import type { ColumnSpec } from "./dataSources";

/** How Add Entry is filling the dialog: one row typed by hand, or one row per
 *  catalog entry with its code already chosen. */
export type BatchMode = "single" | "programs" | "curricula";

export const BATCH_MODE_LABELS: Record<BatchMode, string> = {
  single: "Single entry",
  programs: "5 Departments",
  curricula: "9 Curriculums",
};

/** One pre-built row of a batch. */
export interface BatchRow {
  /** The catalog code this row records against — "PH", "PHB". */
  code: string;
  /** Thai display name, shown beside the code so the row is recognisable. */
  label: string;
  /** Cells the mode fills in and the grid renders read-only: colKey -> code. */
  locked: Record<string, string>;
}

/** The first column of a derived type. A source is not stopped from carrying two
 *  program columns, but the batch — like the entry form's curriculum cascade —
 *  drives the first one and leaves any others to be filled in by hand. */
const firstKeyOfType = (columns: ColumnSpec[], type: ColumnSpec["dataType"]) =>
  columns.find((c) => c.dataType === type)?.colKey ?? null;

/** Which modes this source's columns can support. A batch is only meaningful
 *  when there is a column to put the code in — without one every row would be
 *  an indistinguishable copy of the last. "single" is always available. */
export function availableBatchModes(columns: ColumnSpec[]): BatchMode[] {
  const modes: BatchMode[] = ["single"];
  if (firstKeyOfType(columns, "program")) modes.push("programs");
  if (firstKeyOfType(columns, "curriculum")) modes.push("curricula");
  return modes;
}

/** The column whose value identifies a row within a batch — what a repeat of the
 *  same batch would collide on. */
export function batchColumnKey(
  mode: Exclude<BatchMode, "single">,
  columns: ColumnSpec[],
): string | null {
  return firstKeyOfType(columns, mode === "programs" ? "program" : "curriculum");
}

/** One row per program (or per curriculum), in the catalog's own order.
 *
 *  A curriculum belongs to exactly one program, so batching by curriculum also
 *  fills the program column when the source has one: recording nine curricula
 *  without their programs would leave a source that collects both half blank,
 *  and any link filtering on program would miss every row. The reverse does not
 *  hold — a program has several curricula and none of them is the right guess —
 *  so batching by program leaves a curriculum column empty and editable. */
export function buildBatchRows(
  mode: Exclude<BatchMode, "single">,
  catalog: AcademicCatalog,
  columns: ColumnSpec[],
): BatchRow[] {
  const programKey = firstKeyOfType(columns, "program");
  const curriculumKey = firstKeyOfType(columns, "curriculum");

  if (mode === "programs") {
    if (!programKey) return [];
    return catalog.programs.map((p) => ({
      code: p.code,
      label: p.label,
      locked: { [programKey]: p.code },
    }));
  }

  if (!curriculumKey) return [];
  return catalog.curricula.map((c) => {
    const locked: Record<string, string> = { [curriculumKey]: c.code };
    if (programKey) locked[programKey] = c.programCode;
    return { code: c.code, label: c.label, locked };
  });
}

/** Identity of a batch row against what is already stored: the period plus the
 *  code, rather than the whole row. A source legitimately holds several rows per
 *  program per period, so this is a warning key, not a uniqueness constraint —
 *  it answers "have I already run this batch?", which is the mistake worth
 *  catching. */
export function batchDuplicateKey(
  year: number,
  quarter: number | null,
  colKey: string,
  code: string,
): string {
  return JSON.stringify([year, quarter ?? null, colKey, code]);
}

/** The keys already recorded, built once per batch rather than scanning the
 *  entries for every row. Blank cells are skipped: an entry with no program
 *  recorded is not a prior run of the program batch. */
export function recordedBatchKeys(
  entries: {
    year: number;
    quarter: number | null;
    values: Record<string, DataSourceCellValue>;
  }[],
  colKey: string,
): Set<string> {
  const keys = new Set<string>();
  for (const entry of entries) {
    const cell = entry.values[colKey];
    if (cell === null || cell === undefined || cell === "") continue;
    keys.add(batchDuplicateKey(entry.year, entry.quarter, colKey, String(cell)));
  }
  return keys;
}
