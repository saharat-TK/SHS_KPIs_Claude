// Sub-KPI weight is a percentage contribution used by the weighted_sum roll-up
// (value = Σ(wᵢ/100 · vᵢ)). Absent → default 100; otherwise an integer in [1, 100].
export const WEIGHT_ERROR = "weight must be an integer between 1 and 100";

export function validateWeight(value: unknown): number | { error: string } {
  if (value == null) return 100;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) return { error: WEIGHT_ERROR };
  return n;
}
