// Copy for destructive confirmations. Pure and shared so the two places that
// can delete a KPI — the row menu on the set page and the detail page's bin —
// cannot drift apart on what they promise the user.
//
// NO runtime imports, so tests can load this directly under node's
// type-stripping. Same rule as lib/kpi/progress.ts.

/**
 * Body copy for the "delete this KPI" confirmation.
 *
 * Deleting a library KPI cascades to its sub-KPIs, every annual target and any
 * data-source links, and the KPI disappears from active performance records.
 * Closed and archived records keep their snapshot — `syncActiveRecordsForSet`
 * only prunes records with status 'active' — so "this can't be undone" on its
 * own would overstate the damage. The dialog says both halves.
 *
 * @param subKpiCount LibraryKpi.metricCount on the set page, or the loaded
 *                    metrics' length on the detail page.
 */
export function describeKpiDeletion(name: string, subKpiCount: number): string {
  const subKpis =
    subKpiCount > 0
      ? `Its ${subKpiCount} sub-KPI${subKpiCount === 1 ? "" : "s"} and all annual targets`
      : "Its annual targets";
  return (
    `Delete "${name}"? ${subKpis} will be removed, and it will disappear from ` +
    `active performance records. Closed records keep their history. ` +
    `This can't be undone.`
  );
}
