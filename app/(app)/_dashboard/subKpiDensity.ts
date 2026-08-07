/** Presentation bands for the All Groups category-card sub-KPI preview. */
export type SubKpiDensity = "full" | "compact_detail" | "compact" | "heatmap";

export function subKpiDensity(count: number): SubKpiDensity {
  if (count <= 5) return "full";
  if (count <= 10) return "compact_detail";
  if (count <= 20) return "compact";
  return "heatmap";
}
