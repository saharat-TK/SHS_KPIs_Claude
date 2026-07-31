// What a data-source feed run did, and how to say it in one line.
//
// This module has NO runtime imports on purpose — the same rule as
// lib/kpi/dataSourceFilters.ts. It lets tests load it directly under node's
// type-stripping, which cannot resolve the "@/" alias for value imports, and it
// keeps the summary reachable without pulling in the MySQL pool that
// lib/kpi/dataSourceFeed.ts brings with it. Do not add an import here.

/** One quarter the feed declined to touch, and why. */
export interface FeedSkip {
  target: string;
  yearNo: number;
  quarterNo: number;
  reason: string;
}

export interface FeedOutcome {
  updated: number;
  /** Quarters whose stored value was emptied because the link can no longer
   *  produce one there — see applyLink in lib/kpi/dataSourceFeed.ts. */
  cleared: number;
  skipped: FeedSkip[];
}

export const emptyOutcome = (): FeedOutcome => ({ updated: 0, cleared: 0, skipped: [] });

export const mergeOutcomes = (a: FeedOutcome, b: FeedOutcome): FeedOutcome => ({
  updated: a.updated + b.updated,
  cleared: a.cleared + b.cleared,
  skipped: [...a.skipped, ...b.skipped],
});

/** Short human summary for a toast. */
export function describeOutcome(outcome: FeedOutcome): string {
  const parts = [`${outcome.updated} quarter${outcome.updated === 1 ? "" : "s"} updated`];

  // Only worth saying when it happened: clearing is rare, and a "0 cleared" on
  // every ordinary save would read as though something were wrong.
  if (outcome.cleared > 0) parts.push(`${outcome.cleared} cleared`);

  if (outcome.skipped.length > 0) {
    const byReason = new Map<string, number>();
    for (const s of outcome.skipped) {
      byReason.set(s.reason, (byReason.get(s.reason) ?? 0) + 1);
    }
    const detail = [...byReason.entries()]
      .map(([reason, n]) => `${n} ${reason}`)
      .join(", ");
    parts.push(`${outcome.skipped.length} skipped (${detail})`);
  }
  return parts.join(" · ");
}
