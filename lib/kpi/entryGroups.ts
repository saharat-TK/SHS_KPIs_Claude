// Groups the rows of a multiple-input data source back into the entries they
// were saved from. One entry form with several values (e.g. several SHS authors
// of one paper) is stored as one row per value, with no group id, so the group
// is recovered from the columns every row of an entry shares.
//
// Pure, type-only imports besides columnLinks, so tests load it directly.
import type { DataSourceColumn, DataSourceEntry } from "@/lib/types";
import { entryLayout } from "./columnLinks.ts";

export interface EntryGroupRows {
  key: string;
  rows: DataSourceEntry[];
}

/** Columns that differ from row to row within one entry: the multiple column,
 *  its ref target (the program), and the 1/n share columns. Empty when the
 *  source has no multiple column, which means no grouping at all. */
export function perRowColKeys(columns: DataSourceColumn[]): Set<string> {
  const layout = entryLayout(columns);
  const multiple = layout.groups.find((g) => g.multiple);
  if (!multiple) return new Set();
  const keys = new Set<string>([multiple.main.colKey]);
  if (multiple.target) keys.add(multiple.target.colKey);
  for (const share of layout.shares) keys.add(share.colKey);
  return keys;
}

/** Rows with the same period and shared-column values form one group. The note
 *  is deliberately not part of the key: the entry form saves one note on every
 *  row, but an import gives each row its own (e.g. "pub:<key>:<author>"), and
 *  those rows are still one paper. Groups are ordered by their first row's
 *  position and rows keep their incoming order, so an already-sorted list stays
 *  sorted. */
export function groupEntries(
  entries: DataSourceEntry[],
  columns: DataSourceColumn[],
): EntryGroupRows[] {
  const perRow = perRowColKeys(columns);
  if (perRow.size === 0) {
    return entries.map((entry) => ({ key: String(entry.id), rows: [entry] }));
  }

  const shared = columns.filter((c) => !perRow.has(c.colKey));
  const groups = new Map<string, EntryGroupRows>();
  for (const entry of entries) {
    const key = JSON.stringify([
      entry.year,
      entry.quarter,
      ...shared.map((c) => {
        const v = entry.values[c.colKey];
        return v === undefined || v === "" ? null : v;
      }),
    ]);
    const group = groups.get(key);
    if (group) group.rows.push(entry);
    else groups.set(key, { key, rows: [entry] });
  }
  return [...groups.values()];
}

/** True when the rows of a group don't all carry the same note — an imported
 *  entry. Such notes belong to their own row, so editing the group leaves them
 *  alone rather than copying one note onto every row. */
export function notesDiffer(rows: { note: string | null }[]): boolean {
  const first = rows[0]?.note ?? "";
  return rows.some((row) => (row.note ?? "") !== first);
}

export interface GroupSavePlan {
  /** Existing rows that stay, with their new values. */
  update: number[];
  /** Rows without an id: new values added to the entry. */
  insert: number;
  /** Original rows no longer present: values removed from the entry. */
  remove: number[];
}

/** What saving an edited entry does to the table: rows that carry one of the
 *  entry's original ids are updated, rows without an id are inserted, and
 *  original rows that were dropped are removed. An id that is not one of the
 *  originals (or is repeated) is an error, so a request can never touch a row
 *  outside the entry it was opened from. */
export function planGroupSave(
  originalIds: number[],
  rows: { id?: number }[],
): GroupSavePlan {
  const original = new Set(originalIds);
  const kept = new Set<number>();
  let insert = 0;
  for (const row of rows) {
    if (row.id === undefined) {
      insert += 1;
      continue;
    }
    if (!original.has(row.id)) {
      throw new RangeError(`Row ${row.id} does not belong to this entry`);
    }
    if (kept.has(row.id)) throw new RangeError(`Row ${row.id} appears twice`);
    kept.add(row.id);
  }
  return {
    update: [...kept],
    insert,
    remove: originalIds.filter((id) => !kept.has(id)),
  };
}
