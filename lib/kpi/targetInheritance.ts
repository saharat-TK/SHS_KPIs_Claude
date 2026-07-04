import type { PoolConnection } from "mysql2/promise";

// Keep metrics in "Get from Parent" mode numerically aligned with their parent
// KPI. Performance records do not store the mode; they receive copied numbers
// through the existing library-to-performance sync.
export async function syncInheritedMetricTargetsForKpi(
  conn: PoolConnection,
  kpiId: number,
) {
  await conn.query(
    `UPDATE library_metric m
       JOIN library_kpi k ON k.id = m.kpi_id
        SET m.five_year_target = k.five_year_target
      WHERE m.kpi_id = ? AND m.target_mode = 'inherit_parent'`,
    [kpiId],
  );

  await conn.query(
    `DELETE t FROM library_metric_annual_target t
       JOIN library_metric m ON m.id = t.metric_id
      WHERE m.kpi_id = ? AND m.target_mode = 'inherit_parent'`,
    [kpiId],
  );

  await conn.query(
    `INSERT INTO library_metric_annual_target (metric_id, year_no, target_value)
     SELECT m.id, t.year_no, t.target_value
       FROM library_metric m
       JOIN library_kpi_annual_target t ON t.kpi_id = m.kpi_id
      WHERE m.kpi_id = ? AND m.target_mode = 'inherit_parent'`,
    [kpiId],
  );
}
