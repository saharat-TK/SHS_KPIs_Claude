// Pure helpers behind scripts/export-research-publications.mjs and
// scripts/migrate-research-publications.mjs, kept here so the planning logic —
// what is missing, what differs, what a link points at — is unit-tested like the
// rest of lib/kpi. Only type imports besides the sibling dataSources module, so
// tests and plain node can load it directly.

import type { DataSourceCellValue } from "@/lib/types";
import { entryFingerprint } from "./dataSources.ts";

/** One column of a data source, in the shape the snapshot stores it. */
export interface SnapshotColumn {
  colKey: string;
  label: string;
  dataType: string;
  unit: string | null;
  options: string[] | null;
  refColKey: string | null;
  isMultiple: boolean;
  autoFill: string | null;
  isRequired: boolean;
  sortOrder: number;
}

export interface SnapshotEntry {
  year: number;
  quarter: number | null;
  values: Record<string, DataSourceCellValue>;
  note: string | null;
  isIncomplete: boolean;
  recordedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** A link is named, not numbered: database ids differ between environments. */
export interface SnapshotLink {
  target: { setName: string; kpiName: string; metricName: string | null };
  mappings: unknown[];
  note: string | null;
}

export interface Snapshot {
  version: 1;
  exportedAt: string;
  source: {
    name: string;
    description: string | null;
    committeeId: string;
    periodGrain: "quarterly" | "annual";
    status: "active" | "archived";
  };
  columns: SnapshotColumn[];
  links: SnapshotLink[];
  entries: SnapshotEntry[];
}

/** JSON with object keys sorted, so two equal structures compare equal however
 *  the database happened to order their keys. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** Keep only the values whose key is a current column. A value left behind by a
 *  column that no longer exists (author_position) would be rejected by the
 *  entry validator the next time someone edits the row. */
export function keepColumnValues(
  values: Record<string, DataSourceCellValue>,
  columns: { colKey: string }[],
): Record<string, DataSourceCellValue> {
  const keys = new Set(columns.map((c) => c.colKey));
  return Object.fromEntries(Object.entries(values).filter(([k]) => keys.has(k)));
}

const COLUMN_FIELDS = [
  "label",
  "dataType",
  "unit",
  "options",
  "refColKey",
  "isMultiple",
  "autoFill",
  "isRequired",
  "sortOrder",
] as const;

/** How a source's existing columns differ from the wanted ones. Extra columns
 *  are reported but never removed: they may hold data nobody asked to delete. */
export function columnDiff(existing: SnapshotColumn[], wanted: SnapshotColumn[]) {
  const have = new Map(existing.map((c) => [c.colKey, c]));
  const want = new Set(wanted.map((c) => c.colKey));
  const missing: SnapshotColumn[] = [];
  const changed: { wanted: SnapshotColumn; fields: string[] }[] = [];
  for (const column of wanted) {
    const current = have.get(column.colKey);
    if (!current) {
      missing.push(column);
      continue;
    }
    const fields = COLUMN_FIELDS.filter(
      (f) => stableStringify(current[f]) !== stableStringify(column[f]),
    );
    if (fields.length > 0) changed.push({ wanted: column, fields: [...fields] });
  }
  const extra = existing.filter((c) => !want.has(c.colKey));
  return { missing, changed, extra };
}

/** Which snapshot entries still need inserting. Rows are compared by period and
 *  column values as a multiset: three identical rows in the snapshot against two
 *  already present means one to insert, not zero and not three. */
export function planEntries(
  columns: SnapshotColumn[],
  existing: { year: number; quarter: number | null; values: Record<string, DataSourceCellValue> }[],
  wanted: SnapshotEntry[],
) {
  const specs = columns.map((c) => ({
    colKey: c.colKey,
    label: c.label,
    dataType: c.dataType,
    isRequired: c.isRequired,
  })) as Parameters<typeof entryFingerprint>[0];
  const counts = new Map<string, number>();
  for (const row of existing) {
    const key = entryFingerprint(specs, row.year, row.quarter, row.values);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const toInsert: SnapshotEntry[] = [];
  let present = 0;
  for (const entry of wanted) {
    const key = entryFingerprint(specs, entry.year, entry.quarter, entry.values);
    const left = counts.get(key) ?? 0;
    if (left > 0) {
      counts.set(key, left - 1);
      present += 1;
    } else {
      toInsert.push(entry);
    }
  }
  return { toInsert, present };
}

export interface LibraryIndex {
  kpis: { id: number; setName: string; name: string }[];
  metrics: { id: number; kpiId: number; name: string }[];
}

export type ResolvedTarget =
  | { ok: true; libraryKpiId: number | null; libraryMetricId: number | null }
  | { ok: false; reason: string };

/** Find the library KPI (or metric) a snapshot link names. Names are matched
 *  exactly after trimming; a name that matches several rows is refused rather
 *  than guessed. */
export function resolveLinkTarget(
  target: SnapshotLink["target"],
  library: LibraryIndex,
): ResolvedTarget {
  const same = (a: string, b: string) => a.trim() === b.trim();
  let kpis = library.kpis.filter((k) => same(k.name, target.kpiName));
  if (kpis.length > 1) {
    const inSet = kpis.filter((k) => same(k.setName, target.setName));
    if (inSet.length > 0) kpis = inSet;
  }
  const where = `KPI "${target.kpiName}" in set "${target.setName}"`;
  if (kpis.length === 0) return { ok: false, reason: `${where} was not found` };
  if (kpis.length > 1) return { ok: false, reason: `${where} matches ${kpis.length} KPIs` };

  if (target.metricName == null) {
    return { ok: true, libraryKpiId: kpis[0].id, libraryMetricId: null };
  }
  const metrics = library.metrics.filter(
    (m) => m.kpiId === kpis[0].id && same(m.name, target.metricName as string),
  );
  const named = `metric "${target.metricName}" of ${where}`;
  if (metrics.length === 0) return { ok: false, reason: `${named} was not found` };
  if (metrics.length > 1) return { ok: false, reason: `${named} matches ${metrics.length} metrics` };
  return { ok: true, libraryKpiId: null, libraryMetricId: metrics[0].id };
}

/** What to do with one link, given the link already on that target (if any). */
export function linkAction(
  existingMappings: unknown[] | null,
  wantedMappings: unknown[],
): "create" | "present" | "differs" {
  if (existingMappings == null) return "create";
  return stableStringify(existingMappings) === stableStringify(wantedMappings)
    ? "present"
    : "differs";
}
