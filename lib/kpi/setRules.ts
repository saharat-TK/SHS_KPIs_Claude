// Rules for configuring and deleting a Strategic Set. Pure and shared so the
// route handlers (which enforce) and the Library page (which explains) cannot
// drift apart on what is allowed or why.
//
// NO runtime imports, so tests can load this directly under node's
// type-stripping. Same rule as lib/kpi/progress.ts.

export interface SetRuleInput {
  status: "draft" | "active" | "archived";
  /** Performance records activated from this set (any status). */
  performanceRecordCount?: number;
}

/** Why the set is locked against start-year edits and deletion, or null. */
function lockReason(set: SetRuleInput): string | null {
  if ((set.performanceRecordCount ?? 0) > 0) {
    return "Already activated in Performance";
  }
  if (set.status !== "draft") {
    return "Only draft sets can be changed this way";
  }
  return null;
}

/** null when the start year can be edited, otherwise the reason it can't. */
export function startYearLockReason(set: SetRuleInput): string | null {
  return lockReason(set);
}

/** null when the set can be deleted, otherwise the reason it can't. */
export function deleteBlockReason(set: SetRuleInput): string | null {
  const reason = lockReason(set);
  if (reason === "Only draft sets can be changed this way") {
    return "Only draft sets can be deleted";
  }
  return reason;
}

export function canDeleteSet(set: SetRuleInput): boolean {
  return deleteBlockReason(set) === null;
}

export function canEditStartYear(set: SetRuleInput): boolean {
  return startYearLockReason(set) === null;
}

/** Body copy for the "delete this set" confirmation. */
export function describeSetDeletion(
  name: string,
  kpiCount: number,
  metricCount: number,
): string {
  const kpis = `${kpiCount} KPI${kpiCount === 1 ? "" : "s"}`;
  const subKpis = `${metricCount} sub-KPI${metricCount === 1 ? "" : "s"}`;
  return (
    `Delete "${name}"? Its ${kpis}, ${subKpis}, annual targets, categories ` +
    `and data-source links will be removed. This can't be undone.`
  );
}

/** Whether a typed confirmation matches the set name (trimmed, exact). */
export function deletionConfirmed(typed: string, name: string): boolean {
  return typed.trim() === name.trim() && name.trim().length > 0;
}

// ── Cloning a new set from an existing one ─────────────────────────────────

/** How a new set is seeded: default categories, a source's categories, or a
 *  full copy of the source (categories, KPIs, sub-KPIs and targets). */
export type CloneMode = "empty" | "categories" | "all";

/** What the user types to confirm a clone. Matched case-insensitively. */
export const CLONE_CONFIRM_PHRASE = "Confirm clone";

export function cloneConfirmed(typed: string): boolean {
  return typed.trim().toLowerCase() === CLONE_CONFIRM_PHRASE.toLowerCase();
}

/** Summary shown above the confirmation field. */
export function describeClone(mode: CloneMode, sourceName: string): string {
  if (mode === "categories") {
    return `Copies the categories of "${sourceName}". Its KPIs, sub-KPIs and targets are not copied.`;
  }
  if (mode === "all") {
    return `Copies every category, KPI, sub-KPI and annual target of "${sourceName}".`;
  }
  return "Starts with the default categories and no KPIs.";
}
