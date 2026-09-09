import type { KpiCategoryRecord } from "@/lib/types";

export type KpiCategoryTaxonomy = "strategic" | "routine";

export interface CategorisedKpi {
  categoryId: string | null;
  routineCategoryId?: string | null;
}

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

/**
 * Operational has no category taxonomy of its own, so every non-Routine KPI
 * type uses the Strategic taxonomy. This is shared by the Dashboard and KPI
 * Library so the same KPI cannot appear under different group rules.
 */
export function categoryTaxonomyForKpiType(typeId: string): KpiCategoryTaxonomy {
  return typeId === "routine" ? "routine" : "strategic";
}

/** Return the category column used to group a KPI in the selected type view. */
export function categoryIdForKpiType(
  kpi: CategorisedKpi,
  typeId: string,
): string | null {
  return categoryTaxonomyForKpiType(typeId) === "routine"
    ? kpi.routineCategoryId ?? null
    : kpi.categoryId;
}
