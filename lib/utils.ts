export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

import type { KpiCalculationType, Metric } from "./types";

// Pooled ratio over sub-KPIs: both sides totalled, so a sub-KPI without a usable
// target is left out entirely rather than contributing only a numerator.
function pooledRatio(metrics: Metric[]): number | null {
  const usable = metrics.filter((m) => m.target !== 0);
  if (usable.length === 0) return null;
  const totalTarget = usable.reduce((acc, m) => acc + m.target, 0);
  if (totalTarget === 0) return null;
  return usable.reduce((acc, m) => acc + m.currentValue, 0) / totalTarget;
}

/**
 * Derive a KPI's value from its sub-KPIs for aggregate calculation types.
 * - weighted_sum: percent-weighted sum, Σ(wᵢ/100 · vᵢ) (weights are % contributions)
 * - simple_average: unweighted mean of sub-KPI current values
 * - percent_of_total: pooled percentage, Σvᵢ / Σtargetᵢ · 100
 * - ratio_of_total: the same pooled ratio without the ·100
 * - custom_formula: not aggregated here (formula-driven), returns null
 * Returns null when there is nothing to aggregate.
 */
export function computeKpiValue(
  type: KpiCalculationType,
  metrics: Metric[]
): number | null {
  if (type === "custom_formula" || metrics.length === 0) return null;

  if (type === "percent_of_total" || type === "ratio_of_total") {
    const ratio = pooledRatio(metrics);
    // No usable target on any sub-KPI → no denominator; fall back to a plain
    // sum of the values (no ×100 for percent — a sum is not a fraction).
    if (ratio === null) {
      return metrics.reduce((acc, m) => acc + m.currentValue, 0);
    }
    return type === "percent_of_total" ? ratio * 100 : ratio;
  }

  if (type === "simple_average") {
    const sum = metrics.reduce((acc, m) => acc + m.currentValue, 0);
    return sum / metrics.length;
  }

  // weighted_sum → percent-weighted sum
  return metrics.reduce((acc, m) => acc + (m.weight / 100) * m.currentValue, 0);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
