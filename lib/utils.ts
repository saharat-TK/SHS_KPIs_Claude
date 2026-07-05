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
 * - weighted_sum: percent-weighted sum, Σ(wᵢ/100 · vᵢ) (weights are % contributions)
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
