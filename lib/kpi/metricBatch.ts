// Planning for the sub-KPI batch presets (every program / every curriculum in
// the academic catalog) on the library KPI editor. Each catalog entry becomes a
// sub-KPI named by its Thai label (label_th) and linked to it by catalog_code,
// so a later label edit is offered as a rename instead of a duplicate.
//
// Sub-KPIs from before the link existed are recognised by name: the old
// `${code}-${parent}` format (often hand-edited since — only the `${code}-`
// prefix is matched) is renamed, and an exact label match is just linked.

export type BatchEntry = { code: string; label: string };

export type ExistingMetric = { id: number; name: string; catalogCode: string | null };

export type BatchRow =
  /** No sub-KPI for this entry yet. */
  | { code: string; name: string; status: "create" }
  /** Linked and named by the current label — nothing to do. */
  | { code: string; name: string; status: "exists" }
  /** Unlinked but already named by the label — only the link is written. */
  | { code: string; name: string; status: "link"; metricId: number }
  /** Linked with a stale name, or an old `${code}-…` row — name (and link) written. */
  | { code: string; name: string; status: "rename"; metricId: number; oldName: string };

/** The name a batch entry's sub-KPI gets. Falls back to the code so a blank
 *  label can never produce a nameless sub-KPI. */
export function batchMetricName(entry: BatchEntry): string {
  return entry.label.trim() || entry.code;
}

/** Whether `name` is an old-format batch name for this entry. Matched on the
 *  `${code}-` prefix alone: the rest was the parent name, which may since have
 *  been edited on either side. The hyphen keeps "PH-" off "PHB-…". */
export function isLegacyBatchMetricName(entry: BatchEntry, name: string): boolean {
  return name.trim().startsWith(`${entry.code}-`);
}

/** Decide what the batch does for each entry, given the KPI's current
 *  sub-KPIs. Precedence: a linked row, then an unlinked row already carrying
 *  the label, then an unlinked old-format row. Each existing row is claimed by
 *  at most one entry, and a row linked to another code is never touched. */
export function planBatchRows(
  entries: BatchEntry[],
  parentName: string,
  existing: ExistingMetric[],
): BatchRow[] {
  const unlinked = existing.filter((m) => !m.catalogCode);
  const claimed = new Set<number>();
  const free = (m: ExistingMetric | undefined) =>
    m && !claimed.has(m.id) ? (claimed.add(m.id), m) : undefined;

  return entries.map((entry): BatchRow => {
    const { code } = entry;
    const name = batchMetricName(entry);

    const linked = free(existing.find((m) => m.catalogCode === code));
    if (linked) {
      return linked.name.trim() === name
        ? { code, name, status: "exists" }
        : { code, name, status: "rename", metricId: linked.id, oldName: linked.name };
    }

    const named = free(unlinked.find((m) => m.name.trim() === name));
    if (named) return { code, name, status: "link", metricId: named.id };

    // Several old rows for one code: prefer the untouched `${code}-${parent}`.
    const legacyRows = unlinked.filter(
      (m) => !claimed.has(m.id) && isLegacyBatchMetricName(entry, m.name),
    );
    const legacy = free(
      legacyRows.find((m) => m.name.trim() === `${code}-${parentName}`.trim()) ??
        legacyRows[0],
    );
    if (legacy) {
      return { code, name, status: "rename", metricId: legacy.id, oldName: legacy.name };
    }

    return { code, name, status: "create" };
  });
}
