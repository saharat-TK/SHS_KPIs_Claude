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

/** Rows with the same period, note and shared-column values form one group.
 *  Groups are ordered by their first row's position and rows keep their
 *  incoming order, so an already-sorted list stays sorted. */
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
      entry.note ?? "",
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
