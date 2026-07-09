// Pure, client-safe helpers for showing progress against an annual target on the
// performance pages. Status colour/label come from healthOf(pct, thresholds) +
// HEALTH_LABEL (components/ui/ThresholdBar) — green/amber are treated as PERCENT
// cutoffs of the target.
import type { AnnualTarget, QuarterlyTargetMode, QuarterProgress } from "@/lib/types";

/** The target for a given quarter, derived from the annual target per the KPI's
 *  quarterly-target mode. divide_equally → cumulative annual*q/4 (Q1 25% … Q4
 *  100%); use_annual → the full annual target every quarter. */
export function quarterTargetFor(
  annualTarget: number | null,
  quarter: number,
  mode: QuarterlyTargetMode = "divide_equally",
): number | null {
  if (annualTarget == null) return null;
  return mode === "use_annual" ? annualTarget : (annualTarget * quarter) / 4;
}

/** True when a KPI's unit needs a second variable (Divisor): Percent or Ratio. */
export function unitNeedsDivisor(unit: string | null): boolean {
  const u = unit?.trim().toLowerCase();
  return u === "percent" || u === "ratio";
}

/** Derive a leaf KPI's value from its entered variables per its unit:
 *  Percent → (V1/V2)*100, Ratio → V1/V2, any other unit → V1 (single variable). */
export function kpiValueFromVariables(
  unit: string | null,
  v1: number | null,
  v2: number | null,
): number | null {
  if (v1 == null) return null;
  if (!unitNeedsDivisor(unit)) return v1;
  if (v2 == null || v2 === 0) return null;
  return unit!.trim().toLowerCase() === "percent" ? (v1 / v2) * 100 : v1 / v2;
}

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

/**
 * The nearest earlier *saved* quarter within the same year, used to pre-fill an
 * empty quarter's entry form. Q1 has no source. Parent computed-only rows (a
 * value but no user-entered context) are skipped so we land on a quarter the
 * recorder actually filled.
 */
export function previousQuarterProgress(
  progress: QuarterProgress[] | undefined,
  year: number,
  quarter: number,
): QuarterProgress | undefined {
  if (!progress || quarter <= 1) return undefined;
  for (let q = quarter - 1; q >= 1; q--) {
    const row = progress.find((p) => p.yearNo === year && p.quarterNo === q);
    if (
      row &&
      ((row.issue ?? "").trim() !== "" ||
        (row.solution ?? "").trim() !== "" ||
        row.variable1Value != null ||
        row.variable2Value != null ||
        (row.progressValue != null && !row.isComputed))
    ) {
      return row;
    }
  }
  return undefined;
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
