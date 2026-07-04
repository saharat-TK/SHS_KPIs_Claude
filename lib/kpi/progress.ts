// Pure, client-safe helpers for showing progress against an annual target on the
// performance pages. Status colour/label come from healthOf(pct, thresholds) +
// HEALTH_LABEL (components/ui/ThresholdBar) — green/amber are treated as PERCENT
// cutoffs of the target.
import type { AnnualTarget, QuarterProgress } from "@/lib/types";

/** Latest quarter (highest q) with a non-null entered/computed value for a year. */
export function currentValueForYear(
  progress: QuarterProgress[] | undefined,
  year: number,
): number | null {
  const rows = progress ?? [];
  for (let q = 4; q >= 1; q--) {
    const p = rows.find((x) => x.yearNo === year && x.quarterNo === q);
    if (p && p.progressValue != null) return p.progressValue;
  }
  return null;
}

/** The target for a given year (null if unset). */
export function targetForYear(
  targets: AnnualTarget[] | undefined,
  year: number,
): number | null {
  return (targets ?? []).find((t) => t.yearNo === year)?.targetValue ?? null;
}

/** current / target as a percentage, or null when it can't be computed. */
export function percentOfTarget(
  current: number | null | undefined,
  target: number | null | undefined,
): number | null {
  if (current == null || target == null || target === 0) return null;
  return (current / target) * 100;
}

/** Badge tone for each health status (used for the progress-status pill). */
export const HEALTH_TONE: Record<"healthy" | "watch" | "at_risk", "success" | "warning" | "error"> = {
  healthy: "success",
  watch: "warning",
  at_risk: "error",
};
