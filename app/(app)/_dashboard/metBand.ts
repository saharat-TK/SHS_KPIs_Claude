import type { Health } from "@/lib/kpi/progress";

/**
 * Bucket a "share of KPIs that met target" percentage into the three status
 * colours, so the headline card's tint, its ring, and the strategy cards all
 * grade the same number the same way.
 *
 * Presentation only — a KPI's own health comes from its configured thresholds
 * (healthOf in lib/kpi/progress.ts). These bands are about how a RATIO of KPIs
 * reads at a glance, which is not a domain rule and so does not belong in
 * lib/kpi/.
 */
export function metBand(pct: number | null): Health | null {
  if (pct == null) return null;
  if (pct >= 80) return "healthy";
  if (pct >= 50) return "watch";
  return "at_risk";
}
