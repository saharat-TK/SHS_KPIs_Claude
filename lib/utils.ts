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

/**
 * Derive a KPI's value from its sub-KPIs for aggregate calculation types.
 * - weighted_sum: weighted average, Σ(wᵢ·vᵢ) / Σ(wᵢ) (normalized so uneven weights work)
 * - simple_average: unweighted mean of sub-KPI current values
 * - custom_formula: not aggregated here (formula-driven), returns null
 * Returns null when there is nothing to aggregate.
 */
export function computeKpiValue(
  type: KpiCalculationType,
  metrics: Metric[]
): number | null {
  if (type === "custom_formula" || metrics.length === 0) return null;

  if (type === "simple_average") {
    const sum = metrics.reduce((acc, m) => acc + m.currentValue, 0);
    return sum / metrics.length;
  }

  // weighted_sum → weighted average normalized by total weight
  const totalWeight = metrics.reduce((acc, m) => acc + m.weight, 0);
  if (totalWeight === 0) return null;
  const weighted = metrics.reduce(
    (acc, m) => acc + m.weight * m.currentValue,
    0
  );
  return weighted / totalWeight;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
