// The library_kpi INSERT shared by the single-create and bulk-create routes, so
// both apply the same defaults. Kept out of the route files because Next.js only
// allows HTTP-method/config exports from a route module.
//
// Every KPI created here starts as a draft (is_draft = 1): it shows a "D" badge
// and stays out of performance records until its first Save in the KPI editor
// (PATCH /api/library-kpis/[id] clears the flag and syncs it in).
import { DEFAULT_THRESHOLDS } from "@/lib/kpi/progress";

export const LIBRARY_KPI_INSERT_COLUMNS = `
  set_id, name, description, category_id, routine_category_id, kpi_type,
  data_collect_method,
  collection_period, data_source_url, committee_id, person_in_charge_id,
  weight, unit, five_year_target, calculation_type, calculation_logic,
  formula_id, threshold_green, threshold_amber, sort_order, is_draft
`;

export interface LibraryKpiInsertInput {
  name: string;
  description?: string | null;
  categoryId?: string | null;
  routineCategoryId?: string | null;
  kpiType?: string | null;
  dataCollectMethod?: string | null;
  collectionPeriod?: string | null;
  dataSourceUrl?: string | null;
  committeeId?: string | null;
  personInChargeId?: string | null;
  weight?: number | null;
  unit?: string | null;
  fiveYearTarget?: number | null;
  calculationType?: string | null;
  calculationLogic?: string | null;
  formulaId?: number | null;
  thresholdGreen?: number | null;
  thresholdAmber?: number | null;
}

/** Values in LIBRARY_KPI_INSERT_COLUMNS order. */
export function libraryKpiInsertValues(
  setId: number,
  b: LibraryKpiInsertInput,
  sortOrder: number,
): unknown[] {
  return [
    setId,
    b.name.trim(),
    b.description?.trim() || null,
    b.categoryId || null,
    b.routineCategoryId || null,
    b.kpiType || "operational",
    b.dataCollectMethod?.trim() || null,
    b.collectionPeriod || "every_quarter",
    b.dataSourceUrl?.trim() || null,
    b.committeeId || null,
    b.personInChargeId || null,
    b.weight ?? 0,
    b.unit?.trim() || null,
    b.fiveYearTarget ?? null,
    b.calculationType || "weighted_sum",
    b.calculationLogic?.trim() || null,
    b.formulaId ?? null,
    // `in` rather than `??`: the editor always sends both keys, so an
    // explicit null means "the user cleared this" and must survive. Only
    // an absent key falls back to the standard band.
    "thresholdGreen" in b ? b.thresholdGreen : DEFAULT_THRESHOLDS.green,
    "thresholdAmber" in b ? b.thresholdAmber : DEFAULT_THRESHOLDS.amber,
    sortOrder,
    1, // is_draft
  ];
}
