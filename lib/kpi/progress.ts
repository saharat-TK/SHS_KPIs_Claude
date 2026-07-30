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

/**
 * Whether a data-source link's target may be fed as Variable 1 ÷ Variable 2
 * (two mappings) rather than as one value.
 *
 * KPI-only, deliberately. `library_metric` carries no variable1/variable2
 * definitions, and applyLink writes only the "value" slot for a metric target
 * (lib/kpi/dataSourceFeed.ts) — so a variable mapping on a metric saves
 * cleanly, reports quarters updated, and then stores NULL for every one of
 * them. Editing never offers it either: a link's slots are settled once it
 * exists, since its unique key is built on the target.
 *
 * Shared by both link modals (LinkKpiModal, LinkDataSourceModal) so the rule
 * cannot drift between the two directions of linking.
 */
export function targetAllowsVariables({
  isMetric,
  unit,
  isEdit = false,
}: {
  isMetric: boolean;
  unit: string | null;
  isEdit?: boolean;
}): boolean {
  return !isEdit && !isMetric && unitNeedsDivisor(unit);
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
