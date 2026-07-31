// Pure, client-safe helpers for showing progress against an annual target on the
// performance pages. green/amber are treated as PERCENT cutoffs of the target.
//
// NO runtime imports, on purpose — the same rule as lib/kpi/feedOutcome.ts. It
// lets tests load this directly under node's type-stripping, which cannot
// resolve the "@/" alias for value imports. Type-only imports are erased, so
// they are fine.
import type { AnnualTarget, QuarterlyTargetMode, QuarterProgress, Thresholds } from "@/lib/types";

/** Health status of a value against its percent-of-target cutoffs. */
export type Health = "healthy" | "watch" | "at_risk";

/** Bucket a percent-of-target into a health status. Lives here rather than in
 *  components/ui/ThresholdBar (which re-exports it) so the pure dashboard and
 *  progress maths can reach it without loading a JSX module. */
export function healthOf(value: number, t: Thresholds): Health {
  if (value >= t.green) return "healthy";
  if (value >= t.amber) return "watch";
  return "at_risk";
}

export const HEALTH_LABEL: Record<Health, string> = {
  healthy: "On Target",
  watch: "Watch",
  at_risk: "At Risk",
};

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

/** Whether two units name the same quantity, so a value measured in one can be
 *  compared against a target measured in the other. Same casing and padding
 *  tolerance as unitNeedsDivisor. A missing unit matches nothing, including
 *  another missing one — "unknown" is not a unit two things can share. */
export function sameUnit(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = a?.trim().toLowerCase();
  const right = b?.trim().toLowerCase();
  return !!left && !!right && left === right;
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

/** Bounded sibling of currentValueForYear: the latest non-null value recorded
 *  at or before `quarter` within `year`. This is the single place the dashboard's
 *  "as of Qn" reading is defined — a KPI in use_annual mode typically records
 *  only Q3/Q4, so asking for Q4 must still find the Q3 row. */
export function valueAsOfQuarter(
  progress: QuarterProgress[] | undefined,
  year: number,
  quarter: number,
): number | null {
  const rows = progress ?? [];
  for (let q = quarter; q >= 1; q--) {
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
 *
 * The variable columns are NOT evidence of that on their own: the roll-up and
 * the data-source feed fill them too, with their own numerator/denominator. So
 * they only count on a hand-entered row. Issue/solution stay unconditional —
 * those really are typed by a person, even on a computed parent.
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
        (!row.isComputed &&
          (row.variable1Value != null ||
            row.variable2Value != null ||
            row.progressValue != null)))
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

/** Fill + label colour for a health status, marked !important because `cn`
 *  (lib/utils.ts) is a plain join with no tailwind-merge — an un-important
 *  override can silently lose to a component's own base classes (e.g. Card's
 *  bg-surface-lowest). text-mute on these fills is only ~3.7:1, under AA for
 *  small text, so the paired colour replaces it wherever this is applied. */
export const HEALTH_SURFACE: Record<
  "healthy" | "watch" | "at_risk",
  { card: string; muted: string }
> = {
  healthy: { card: "!bg-[#e9f3dd] !border-[#bcd99a]", muted: "text-[#2f6500]" },
  watch: { card: "!bg-[#fbeed6] !border-[#e9c98a]", muted: "text-[#8a4b00]" },
  at_risk: { card: "!bg-error-container !border-[#f0b6b0]", muted: "text-on-error-container" },
};
