import type { KpiCategoryRecord } from "@/lib/types";

// Categories split into two independent taxonomies by `kpiType`:
//   strategic — what the category tab bars and the dashboard group by
//               (library_kpi.category_id)
//   routine   — the school's ด้านที่ 1–7 operating areas
//               (library_kpi.routine_category_id)
// One fetch per set serves both dropdowns; the split happens here.
export function categoriesOfType(
  categories: KpiCategoryRecord[],
  typeId: string,
): KpiCategoryRecord[] {
  return categories.filter((c) => c.kpiType === typeId);
}
