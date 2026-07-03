// Shared SELECT column lists for the library KPI/metric routes. Kept out of the
// route.ts files because Next.js only allows HTTP-method/config exports from a
// route module — re-exporting a constant from there fails route typegen.
// Aliases snake_case columns to the camelCase fields on LibraryKpi/LibraryMetric.

export const LIBRARY_KPI_FIELDS = `
  k.id, k.set_id AS setId, k.name, k.description, k.category_id AS categoryId,
  k.kpi_type AS kpiType, k.data_collect_method AS dataCollectMethod,
  k.collection_period AS collectionPeriod, k.data_source_url AS dataSourceUrl,
  k.committee_id AS committeeId, k.person_in_charge_id AS personInChargeId,
  k.weight, k.unit, k.five_year_target AS fiveYearTarget,
  k.calculation_type AS calculationType, k.calculation_logic AS calculationLogic,
  k.formula_id AS formulaId, k.threshold_green AS thresholdGreen,
  k.threshold_amber AS thresholdAmber, k.sort_order AS sortOrder
`;

export const LIBRARY_METRIC_FIELDS = `
  m.id, m.kpi_id AS kpiId, m.name, m.description, m.category_id AS categoryId,
  m.data_collect_method AS dataCollectMethod, m.collection_period AS collectionPeriod,
  m.data_source_url AS dataSourceUrl, m.committee_id AS committeeId,
  m.person_in_charge_id AS personInChargeId, m.weight, m.unit,
  m.five_year_target AS fiveYearTarget, m.threshold_green AS thresholdGreen,
  m.threshold_amber AS thresholdAmber, m.sort_order AS sortOrder
`;
