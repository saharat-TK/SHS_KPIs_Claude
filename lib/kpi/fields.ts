// Shared SELECT column lists for the library KPI/metric routes. Kept out of the
// route.ts files because Next.js only allows HTTP-method/config exports from a
// route module — re-exporting a constant from there fails route typegen.
// Aliases snake_case columns to the camelCase fields on LibraryKpi/LibraryMetric.

export const LIBRARY_KPI_FIELDS = `
  k.id, k.set_id AS setId, k.name, k.description, k.category_id AS categoryId,
  k.routine_category_id AS routineCategoryId,
  k.kpi_type AS kpiType, k.data_collect_method AS dataCollectMethod,
  k.collection_period AS collectionPeriod, k.data_source_url AS dataSourceUrl,
  k.committee_id AS committeeId, k.person_in_charge_id AS personInChargeId,
  k.weight, k.unit, k.five_year_target AS fiveYearTarget,
  k.calculation_type AS calculationType, k.calculation_logic AS calculationLogic,
  k.formula_id AS formulaId, k.threshold_green AS thresholdGreen,
  k.threshold_amber AS thresholdAmber,
  k.quarterly_target_mode AS quarterlyTargetMode,
  k.variable1_name AS variable1Name, k.variable1_unit AS variable1Unit,
  k.variable2_name AS variable2Name, k.variable2_unit AS variable2Unit,
  k.sort_order AS sortOrder
`;

export const LIBRARY_METRIC_FIELDS = `
  m.id, m.kpi_id AS kpiId, m.name, m.description, m.category_id AS categoryId,
  m.data_collect_method AS dataCollectMethod, m.collection_period AS collectionPeriod,
  m.data_source_url AS dataSourceUrl, m.committee_id AS committeeId,
  m.person_in_charge_id AS personInChargeId, m.weight, m.unit,
  m.five_year_target AS fiveYearTarget, m.target_mode AS targetMode,
  m.threshold_green AS thresholdGreen,
  m.threshold_amber AS thresholdAmber, m.sort_order AS sortOrder
`;

// Performance-layer snapshot rows (aliased k. / m.).
export const PERF_KPI_FIELDS = `
  k.id, k.record_id AS recordId, k.source_kpi_id AS sourceKpiId, k.name, k.description,
  k.category_id AS categoryId, k.routine_category_id AS routineCategoryId,
  k.kpi_type AS kpiType, k.data_collect_method AS dataCollectMethod,
  k.collection_period AS collectionPeriod, k.data_source_url AS dataSourceUrl,
  k.committee_id AS committeeId, k.person_in_charge_id AS personInChargeId,
  k.weight, k.unit, k.five_year_target AS fiveYearTarget,
  k.calculation_type AS calculationType, k.calculation_logic AS calculationLogic,
  k.formula_id AS formulaId, k.threshold_green AS thresholdGreen,
  k.threshold_amber AS thresholdAmber,
  k.quarterly_target_mode AS quarterlyTargetMode,
  k.variable1_name AS variable1Name, k.variable1_unit AS variable1Unit,
  k.variable2_name AS variable2Name, k.variable2_unit AS variable2Unit,
  k.sort_order AS sortOrder,
  k.has_children AS hasChildren
`;

// One recorded KPI quarter. Unaliased, so callers that join prepend their own
// key column (e.g. `perf_kpi_id AS perfKpiId,`). Shared because this SELECT is
// otherwise repeated per route, which is how the record-list endpoint ended up
// silently omitting the variable columns.
export const KPI_QUARTER_PROGRESS_FIELDS = `
  year_no AS yearNo, quarter_no AS quarterNo, progress_value AS progressValue,
  variable1_value AS variable1Value, variable2_value AS variable2Value,
  is_computed AS isComputed, value_source AS valueSource, issue, solution
`;

// One recorded metric quarter, same convention as KPI_QUARTER_PROGRESS_FIELDS
// above (unaliased; callers prepend their own key column). No value_source —
// see the note on perf_metric_quarter_progress in the schema.
export const METRIC_QUARTER_PROGRESS_FIELDS = `
  year_no AS yearNo, quarter_no AS quarterNo, progress_value AS progressValue,
  variable1_value AS variable1Value, variable2_value AS variable2Value,
  is_computed AS isComputed, issue, solution
`;

export const PERF_METRIC_FIELDS = `
  m.id, m.perf_kpi_id AS perfKpiId, m.source_metric_id AS sourceMetricId, m.name, m.description,
  m.category_id AS categoryId, m.data_collect_method AS dataCollectMethod,
  m.collection_period AS collectionPeriod, m.data_source_url AS dataSourceUrl,
  m.committee_id AS committeeId, m.person_in_charge_id AS personInChargeId,
  m.weight, m.unit, m.five_year_target AS fiveYearTarget,
  m.threshold_green AS thresholdGreen, m.threshold_amber AS thresholdAmber, m.sort_order AS sortOrder
`;
