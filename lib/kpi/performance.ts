// Server-only helpers that copy a library strategic set into a performance
// record and re-sync it later. Both run inside a caller-provided transaction.
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

// Roll-up of child metric values for one quarter, per the KPI's calculation
// type. Nulls (metrics not yet entered) are excluded. custom_formula is not
// auto-computed here (its variables aren't tied to metrics) → returns null.
function rollup(
  calcType: string,
  rows: { weight: number; value: number | null }[],
): number | null {
  const present = rows.filter((r) => r.value != null) as { weight: number; value: number }[];
  if (present.length === 0) return null;
  if (calcType === "simple_average") {
    return present.reduce((a, r) => a + r.value, 0) / present.length;
  }
  if (calcType === "weighted_sum") {
    const tw = present.reduce((a, r) => a + r.weight, 0);
    if (tw === 0) return null;
    return present.reduce((a, r) => a + r.weight * r.value, 0) / tw;
  }
  return null;
}

// Recompute a has_children KPI's progress for one (year, quarter) from its
// child metrics and write it back with is_computed=1, leaving the KPI's own
// issue/solution untouched. No-op for leaf KPIs.
export async function recomputeKpiQuarter(
  conn: PoolConnection,
  perfKpiId: number,
  yearNo: number,
  quarterNo: number,
) {
  const [kpiRows] = await conn.query<RowDataPacket[]>(
    "SELECT calculation_type, has_children FROM perf_kpi WHERE id = ?",
    [perfKpiId],
  );
  if (kpiRows.length === 0 || !kpiRows[0].has_children) return;

  const [metricRows] = await conn.query<RowDataPacket[]>(
    `SELECT m.weight AS weight, p.progress_value AS value
       FROM perf_metric m
       LEFT JOIN perf_metric_quarter_progress p
         ON p.perf_metric_id = m.id AND p.year_no = ? AND p.quarter_no = ?
      WHERE m.perf_kpi_id = ?`,
    [yearNo, quarterNo, perfKpiId],
  );
  const value = rollup(kpiRows[0].calculation_type, metricRows.map((r) => ({
    weight: Number(r.weight),
    value: r.value == null ? null : Number(r.value),
  })));

  await conn.query(
    `INSERT INTO perf_kpi_quarter_progress (perf_kpi_id, year_no, quarter_no, progress_value, is_computed)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value), is_computed = 1`,
    [perfKpiId, yearNo, quarterNo, value],
  );
}

const PERF_KPI_INSERT_COLS = `record_id, source_kpi_id, name, description, category_id,
  kpi_type, data_collect_method, collection_period, data_source_url, committee_id,
  person_in_charge_id, weight, unit, five_year_target, calculation_type,
  calculation_logic, formula_id, threshold_green, threshold_amber, sort_order, has_children`;

const PERF_METRIC_INSERT_COLS = `perf_kpi_id, source_metric_id, name, description, category_id,
  data_collect_method, collection_period, data_source_url, committee_id,
  person_in_charge_id, weight, unit, five_year_target, threshold_green,
  threshold_amber, sort_order`;

// Columns updated on re-sync (definition + config, NOT identity or progress).
const PERF_KPI_UPDATE = `name=?, description=?, category_id=?, kpi_type=?, data_collect_method=?,
  collection_period=?, data_source_url=?, committee_id=?, person_in_charge_id=?, weight=?,
  unit=?, five_year_target=?, calculation_type=?, calculation_logic=?, formula_id=?,
  threshold_green=?, threshold_amber=?, sort_order=?, has_children=?`;

const PERF_METRIC_UPDATE = `name=?, description=?, category_id=?, data_collect_method=?,
  collection_period=?, data_source_url=?, committee_id=?, person_in_charge_id=?, weight=?,
  unit=?, five_year_target=?, threshold_green=?, threshold_amber=?, sort_order=?`;

const kpiValues = (recordId: number, k: RowDataPacket, hasChildren: number) => [
  recordId, k.id, k.name, k.description, k.category_id, k.kpi_type, k.data_collect_method,
  k.collection_period, k.data_source_url, k.committee_id, k.person_in_charge_id, k.weight,
  k.unit, k.five_year_target, k.calculation_type, k.calculation_logic, k.formula_id,
  k.threshold_green, k.threshold_amber, k.sort_order, hasChildren,
];

const metricValues = (perfKpiId: number, m: RowDataPacket) => [
  perfKpiId, m.id, m.name, m.description, m.category_id, m.data_collect_method,
  m.collection_period, m.data_source_url, m.committee_id, m.person_in_charge_id, m.weight,
  m.unit, m.five_year_target, m.threshold_green, m.threshold_amber, m.sort_order,
];

async function kpiHasChildren(conn: PoolConnection, libKpiId: number): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM library_metric WHERE kpi_id = ?",
    [libKpiId],
  );
  return rows[0].n > 0 ? 1 : 0;
}

async function copyMetricInto(conn: PoolConnection, perfKpiId: number, m: RowDataPacket) {
  const [ins] = await conn.query<ResultSetHeader>(
    `INSERT INTO perf_metric (${PERF_METRIC_INSERT_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    metricValues(perfKpiId, m),
  );
  await conn.query(
    `INSERT INTO perf_metric_annual_target (perf_metric_id, year_no, target_value)
     SELECT ?, year_no, target_value FROM library_metric_annual_target WHERE metric_id = ?`,
    [ins.insertId, m.id],
  );
  return ins.insertId;
}

// ── Activation: full deep copy of a set's KPI tree into a new record. ─────────
export async function copySetIntoRecord(
  conn: PoolConnection,
  setId: number,
  recordId: number,
) {
  const [kpis] = await conn.query<RowDataPacket[]>(
    "SELECT * FROM library_kpi WHERE set_id = ? ORDER BY sort_order, id",
    [setId],
  );
  for (const k of kpis) {
    const hasChildren = await kpiHasChildren(conn, k.id);
    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO perf_kpi (${PERF_KPI_INSERT_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      kpiValues(recordId, k, hasChildren),
    );
    const perfKpiId = ins.insertId;
    await conn.query(
      `INSERT INTO perf_kpi_annual_target (perf_kpi_id, year_no, target_value)
       SELECT ?, year_no, target_value FROM library_kpi_annual_target WHERE kpi_id = ?`,
      [perfKpiId, k.id],
    );
    const [metrics] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM library_metric WHERE kpi_id = ? ORDER BY sort_order, id",
      [k.id],
    );
    for (const m of metrics) await copyMetricInto(conn, perfKpiId, m);
  }
}

// ── Re-sync (decision #4): match perf rows to library rows by source_*_id.
// Definitions + targets are overwritten; entered quarter progress is preserved.
// Library rows deleted after activation are removed from the snapshot (their
// progress cascades away — see schema note on a future retired_at flag).
export async function syncRecordFromLibrary(conn: PoolConnection, recordId: number) {
  const [recRows] = await conn.query<RowDataPacket[]>(
    "SELECT source_set_id FROM performance_record WHERE id = ?",
    [recordId],
  );
  if (recRows.length === 0) throw new Error("Performance record not found");
  const setId = recRows[0].source_set_id;

  const [perfKpis] = await conn.query<RowDataPacket[]>(
    "SELECT id, source_kpi_id FROM perf_kpi WHERE record_id = ?",
    [recordId],
  );
  const perfKpiBySource = new Map<number, number>(
    perfKpis.filter((p) => p.source_kpi_id != null).map((p) => [p.source_kpi_id, p.id]),
  );
  const keptKpiIds = new Set<number>();

  const [libKpis] = await conn.query<RowDataPacket[]>(
    "SELECT * FROM library_kpi WHERE set_id = ? ORDER BY sort_order, id",
    [setId],
  );

  for (const k of libKpis) {
    const hasChildren = await kpiHasChildren(conn, k.id);
    let perfKpiId = perfKpiBySource.get(k.id);

    if (perfKpiId) {
      await conn.query(`UPDATE perf_kpi SET ${PERF_KPI_UPDATE} WHERE id = ?`, [
        k.name, k.description, k.category_id, k.kpi_type, k.data_collect_method,
        k.collection_period, k.data_source_url, k.committee_id, k.person_in_charge_id,
        k.weight, k.unit, k.five_year_target, k.calculation_type, k.calculation_logic,
        k.formula_id, k.threshold_green, k.threshold_amber, k.sort_order, hasChildren,
        perfKpiId,
      ]);
      await conn.query("DELETE FROM perf_kpi_annual_target WHERE perf_kpi_id = ?", [perfKpiId]);
      await conn.query(
        `INSERT INTO perf_kpi_annual_target (perf_kpi_id, year_no, target_value)
         SELECT ?, year_no, target_value FROM library_kpi_annual_target WHERE kpi_id = ?`,
        [perfKpiId, k.id],
      );
    } else {
      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO perf_kpi (${PERF_KPI_INSERT_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        kpiValues(recordId, k, hasChildren),
      );
      perfKpiId = ins.insertId;
      await conn.query(
        `INSERT INTO perf_kpi_annual_target (perf_kpi_id, year_no, target_value)
         SELECT ?, year_no, target_value FROM library_kpi_annual_target WHERE kpi_id = ?`,
        [perfKpiId, k.id],
      );
    }
    keptKpiIds.add(perfKpiId);

    // Sync this KPI's metrics.
    const [perfMetrics] = await conn.query<RowDataPacket[]>(
      "SELECT id, source_metric_id FROM perf_metric WHERE perf_kpi_id = ?",
      [perfKpiId],
    );
    const pmBySource = new Map<number, number>(
      perfMetrics.filter((m) => m.source_metric_id != null).map((m) => [m.source_metric_id, m.id]),
    );
    const keptMetricIds = new Set<number>();

    const [libMetrics] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM library_metric WHERE kpi_id = ? ORDER BY sort_order, id",
      [k.id],
    );
    for (const m of libMetrics) {
      const pmId = pmBySource.get(m.id);
      if (pmId) {
        await conn.query(`UPDATE perf_metric SET ${PERF_METRIC_UPDATE} WHERE id = ?`, [
          m.name, m.description, m.category_id, m.data_collect_method, m.collection_period,
          m.data_source_url, m.committee_id, m.person_in_charge_id, m.weight, m.unit,
          m.five_year_target, m.threshold_green, m.threshold_amber, m.sort_order, pmId,
        ]);
        await conn.query("DELETE FROM perf_metric_annual_target WHERE perf_metric_id = ?", [pmId]);
        await conn.query(
          `INSERT INTO perf_metric_annual_target (perf_metric_id, year_no, target_value)
           SELECT ?, year_no, target_value FROM library_metric_annual_target WHERE metric_id = ?`,
          [pmId, m.id],
        );
        keptMetricIds.add(pmId);
      } else {
        keptMetricIds.add(await copyMetricInto(conn, perfKpiId, m));
      }
    }
    for (const pm of perfMetrics) {
      if (!keptMetricIds.has(pm.id)) {
        await conn.query("DELETE FROM perf_metric WHERE id = ?", [pm.id]);
      }
    }
  }

  for (const p of perfKpis) {
    if (!keptKpiIds.has(p.id)) {
      await conn.query("DELETE FROM perf_kpi WHERE id = ?", [p.id]);
    }
  }

  await conn.query(
    "UPDATE performance_record SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?",
    [recordId],
  );
}
