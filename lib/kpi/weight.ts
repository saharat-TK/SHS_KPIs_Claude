// Sub-KPI weight is a percentage contribution used by the weighted_sum roll-up
// (value = Σ(wᵢ/100 · vᵢ)). Absent → default 100; otherwise an integer in [1, 100].
export const WEIGHT_ERROR = "weight must be an integer between 1 and 100";

export function validateWeight(value: unknown): number | { error: string } {
  if (value == null) return 100;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) return { error: WEIGHT_ERROR };
  return n;
}

/** Warning for a weighted_sum KPI whose sub-KPI weights do not total 100, or
 *  null when they do.
 *
 *  rollupParts applies each weight as wᵢ/100 and never normalises, so the total
 *  is the scale of the answer: weights summing to 400 quadruple it, and 80
 *  reports four-fifths of the true weighted mean. Nothing enforces the total —
 *  validateWeight only bounds each weight on its own — so this is advisory, for
 *  the editor to show. Only weighted_sum reads weight at all; every other
 *  calculation_type ignores it, and warning there would be noise. */
export function weightSumWarning(weights: number[]): string | null {
  if (weights.length === 0) return null;
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 100) return null;
  return (
    `Sub-KPI weights total ${total}%, not 100%. A weighted sum multiplies each ` +
    `sub-KPI by its weight ÷ 100 without rescaling, so this KPI reads ${total}% ` +
    `of its true weighted average.`
  );
}
