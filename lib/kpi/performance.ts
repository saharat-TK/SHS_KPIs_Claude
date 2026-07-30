// Server-only helpers that copy a library strategic set into a performance
// record and re-sync it later. Both run inside a caller-provided transaction.
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { QuarterlyTargetMode } from "@/lib/types";

interface RollupRow {
  weight: number;
  value: number | null;
  target?: number | null;
  /** What the metric itself divided, from perf_metric_quarter_progress. Present
   *  only when the metric's own aggregation was a fraction (percent_of /
   *  ratio_of) — a sum or count leaves v2 null. Read by the combined_* types. */
  v1?: number | null;
  v2?: number | null;
}

/** Total a numerator and a denominator across the children that carry both.
 *  A child with only one side is dropped: contributing to one total and not the
 *  other would skew the result. Null when nothing is usable, i.e. when there is
 *  no denominator to divide by at all. */
function poolTotals(
  rows: RollupRow[],
  numerator: (r: RollupRow) => number | null | undefined,
  denominator: (r: RollupRow) => number | null | undefined,
): { numerator: number; denominator: number } | null {
  const usable = rows.filter((r) => {
    const d = denominator(r);
    return numerator(r) != null && d != null && d !== 0;
  });
  if (usable.length === 0) return null;
  const total = usable.reduce((a, r) => a + denominator(r)!, 0);
  if (total === 0) return null;
  return { numerator: usable.reduce((a, r) => a + numerator(r)!, 0), denominator: total };
}

// Progress pooled over targets: "how much of what we aimed for did we get".
// Sound only while each child's value is a COUNT on the same scale as its
// target — see the combined_* pool below for children that are fractions.
const pooledParts = (rows: RollupRow[]) =>
  poolTotals(rows, (r) => r.value, (r) => r.target);

// The children's own numerators pooled over their own denominators: the true
// overall rate, e.g. Σ employed ÷ Σ graduates.
const combinedParts = (rows: RollupRow[]) =>
  poolTotals(rows, (r) => r.v1, (r) => r.v2);

// Plain sum of the present child values. Fallback for the pooled ratio/percent
// roll-ups when no metric has a usable target (so there is no denominator to
// divide by). Returns null only when no child has a value at all.
function sumOfValues(rows: { value: number | null }[]): number | null {
  const present = rows.filter((r) => r.value != null);
  if (present.length === 0) return null;
  return present.reduce((a, r) => a + r.value!, 0);
}

/** A roll-up result plus the two numbers it was derived from, stored on the
 *  quarter row as variable1_value / variable2_value so a computed KPI can show
 *  "115 of 150" behind its 76.7%. variable2 is null when the calculation has no
 *  divisor at all. */
export interface RollupParts {
  value: number | null;
  variable1: number | null;
  variable2: number | null;
}

const NO_PARTS: RollupParts = { value: null, variable1: null, variable2: null };

/**
 * Roll-up of child metric values for one quarter, per the KPI's calculation
 * type, together with the numerator/denominator behind it. Nulls (metrics not
 * yet entered) are excluded. custom_formula is not auto-computed here (its
 * variables aren't tied to metrics) → all three come back null.
 *
 *   percent_of_total  V1 = Σ usable values, V2 = Σ usable targets, value = V1/V2*100
 *   ratio_of_total    V1 = Σ usable values, V2 = Σ usable targets, value = V1/V2
 *   …either, no usable target (fallback)   V1 = Σ present values, V2 = null, value = V1
 *   combined_percent  V1 = Σ child v1, V2 = Σ child v2, value = V1/V2*100
 *   combined_ratio    V1 = Σ child v1, V2 = Σ child v2, value = V1/V2
 *   simple_average    V1 = Σ present values, V2 = how many had one, value = V1/V2
 *   weighted_sum      V1 = Σ (weight/100 × value), V2 = null, value = V1
 *
 * Choosing between the two pooled families is about what the CHILDREN are, not
 * what the parent's unit is. *_of_total divides progress by target, which needs
 * each child's value to be a count on its target's scale ("270 admitted of 315
 * planned"). combined_* divides the children's own numerators by their own
 * denominators, which is the only correct answer when a child is itself a
 * fraction — percentages do not add, so Σ of four employment rates is not an
 * employment rate.
 *
 * IMPORTANT: these pairs are driven by calculation_type, NOT by the KPI's unit,
 * so — unlike a hand-entered row — they are not re-derivable through
 * kpiValueFromVariables(unit, v1, v2). The two pooled types happen to coincide
 * with it, but simple_average on a 'percent' unit is V1/V2 with no ×100. Never
 * run kpiValueFromVariables on a row whose value_source isn't 'manual'.
 * combined_* is the one genuine exception — its pair really is the KPI's own
 * Variable 1 ÷ Variable 2 — but the rule stays as written, because nothing
 * downstream should have to check calculation_type to know whether it holds.
 */
export function rollupParts(calcType: string, rows: RollupRow[]): RollupParts {
  // ratio_of_total / percent_of_total pool progress over targets. When no
  // metric has a usable target (all missing or zero) there is no denominator,
  // so fall back to a plain sum of the child values. The percent variant does
  // NOT scale the fallback by 100 — a plain sum is not a fraction to convert.
  if (calcType === "ratio_of_total" || calcType === "percent_of_total") {
    const pooled = pooledParts(rows);
    if (pooled !== null) {
      const ratio = pooled.numerator / pooled.denominator;
      return {
        value: calcType === "percent_of_total" ? ratio * 100 : ratio,
        variable1: pooled.numerator,
        variable2: pooled.denominator,
      };
    }
    const sum = sumOfValues(rows);
    return { value: sum, variable1: sum, variable2: null };
  }

  // combined_percent / combined_ratio pool what the children themselves
  // divided. No sum-of-values fallback here, deliberately: without denominators
  // there is no rate to report, and a bare sum of numerators would read as one.
  if (calcType === "combined_percent" || calcType === "combined_ratio") {
    const pooled = combinedParts(rows);
    if (pooled === null) return NO_PARTS;
    const ratio = pooled.numerator / pooled.denominator;
    return {
      value: calcType === "combined_percent" ? ratio * 100 : ratio,
      variable1: pooled.numerator,
      variable2: pooled.denominator,
    };
  }

  const present = rows.filter((r) => r.value != null) as { weight: number; value: number }[];
  if (present.length === 0) return NO_PARTS;
  if (calcType === "simple_average") {
    const total = present.reduce((a, r) => a + r.value, 0);
    return { value: total / present.length, variable1: total, variable2: present.length };
  }
  if (calcType === "weighted_sum") {
    // Percent-weighted sum: each weight is a percentage contribution. Nothing
    // divides it, so the weighted total IS the value.
    const total = present.reduce((a, r) => a + (r.weight / 100) * r.value, 0);
    return { value: total, variable1: total, variable2: null };
  }
  return NO_PARTS;
}

/** The roll-up value alone — see rollupParts for the semantics. */
export function rollup(calcType: string, rows: RollupRow[]): number | null {
  return rollupParts(calcType, rows).value;
}

// Recompute a has_children KPI's progress for one (year, quarter) from its
// child metrics and write it back with is_computed=1 and value_source='rollup',
// alongside the numerator/denominator it divided, leaving the KPI's own
// issue/solution untouched. No-op for leaf KPIs.
export async function recomputeKpiQuarter(
  conn: PoolConnection,
  perfKpiId: number,
  yearNo: number,
  quarterNo: number,
) {
  const [kpiRows] = await conn.query<RowDataPacket[]>(
    "SELECT calculation_type, quarterly_target_mode, has_children FROM perf_kpi WHERE id = ?",
    [perfKpiId],
  );
  if (kpiRows.length === 0 || !kpiRows[0].has_children) return;

  // Metrics inherit the parent KPI's quarterly-target mode; the per-metric
  // quarter target (used by the percent_of_total roll-up) is derived from it in JS.
  const mode = kpiRows[0].quarterly_target_mode as QuarterlyTargetMode;
  const [metricRows] = await conn.query<RowDataPacket[]>(
    `SELECT m.weight AS weight,
            p.progress_value AS value,
            p.variable1_value AS v1,
            p.variable2_value AS v2,
            t.target_value AS annualTarget
       FROM perf_metric m
       LEFT JOIN perf_metric_quarter_progress p
         ON p.perf_metric_id = m.id AND p.year_no = ? AND p.quarter_no = ?
       LEFT JOIN perf_metric_annual_target t
         ON t.perf_metric_id = m.id AND t.year_no = ?
      WHERE m.perf_kpi_id = ?`,
    [yearNo, quarterNo, yearNo, perfKpiId],
  );
  const parts = rollupParts(kpiRows[0].calculation_type, metricRows.map((r) => {
    // Mirror lib/kpi/progress.ts#quarterTargetFor. Kept inline (not imported)
    // so this server module has no runtime cross-import for the test runner.
    const annual = r.annualTarget == null ? null : Number(r.annualTarget);
    const target =
      annual == null ? null : mode === "use_annual" ? annual : (annual * quarterNo) / 4;
    return {
      weight: Number(r.weight),
      value: r.value == null ? null : Number(r.value),
      target,
      v1: r.v1 == null ? null : Number(r.v1),
      v2: r.v2 == null ? null : Number(r.v2),
    };
  }));

  await conn.query(
    `INSERT INTO perf_kpi_quarter_progress
       (perf_kpi_id, year_no, quarter_no, progress_value, variable1_value, variable2_value,
        is_computed, value_source)
     VALUES (?, ?, ?, ?, ?, ?, 1, 'rollup')
     ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value),
       variable1_value = VALUES(variable1_value), variable2_value = VALUES(variable2_value),
       is_computed = 1, value_source = 'rollup'`,
    [perfKpiId, yearNo, quarterNo, parts.value, parts.variable1, parts.variable2],
  );
}

const PERF_KPI_INSERT_COLS = `record_id, source_kpi_id, name, description, category_id,
  kpi_type, data_collect_method, collection_period, data_source_url, committee_id,
  person_in_charge_id, weight, unit, five_year_target, calculation_type,
  calculation_logic, formula_id, threshold_green, threshold_amber, quarterly_target_mode,
  variable1_name, variable1_unit, variable2_name, variable2_unit,
  sort_order, has_children`;

const PERF_METRIC_INSERT_COLS = `perf_kpi_id, source_metric_id, name, description, category_id,
  data_collect_method, collection_period, data_source_url, committee_id,
  person_in_charge_id, weight, unit, five_year_target, threshold_green,
  threshold_amber, sort_order`;

// Columns updated on re-sync (definition + config, NOT identity or progress).
const PERF_KPI_UPDATE = `name=?, description=?, category_id=?, kpi_type=?, data_collect_method=?,
  collection_period=?, data_source_url=?, committee_id=?, person_in_charge_id=?, weight=?,
  unit=?, five_year_target=?, calculation_type=?, calculation_logic=?, formula_id=?,
  threshold_green=?, threshold_amber=?, quarterly_target_mode=?,
  variable1_name=?, variable1_unit=?, variable2_name=?, variable2_unit=?,
  sort_order=?, has_children=?`;

const PERF_METRIC_UPDATE = `name=?, description=?, category_id=?, data_collect_method=?,
  collection_period=?, data_source_url=?, committee_id=?, person_in_charge_id=?, weight=?,
  unit=?, five_year_target=?, threshold_green=?, threshold_amber=?, sort_order=?`;

const kpiValues = (recordId: number, k: RowDataPacket, hasChildren: number) => [
  recordId, k.id, k.name, k.description, k.category_id, k.kpi_type, k.data_collect_method,
  k.collection_period, k.data_source_url, k.committee_id, k.person_in_charge_id, k.weight,
  k.unit, k.five_year_target, k.calculation_type, k.calculation_logic, k.formula_id,
  k.threshold_green, k.threshold_amber, k.quarterly_target_mode,
  k.variable1_name, k.variable1_unit, k.variable2_name, k.variable2_unit,
  k.sort_order, hasChildren,
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
      `INSERT INTO perf_kpi (${PERF_KPI_INSERT_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        k.formula_id, k.threshold_green, k.threshold_amber, k.quarterly_target_mode,
        k.variable1_name, k.variable1_unit, k.variable2_name, k.variable2_unit,
        k.sort_order, hasChildren,
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
        `INSERT INTO perf_kpi (${PERF_KPI_INSERT_COLS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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

// ── Auto-propagation of library edits to active performance records ───────────

/** Resolve the strategic set that owns a library KPI (null if not found). */
export async function setIdForKpi(
  conn: PoolConnection,
  libKpiId: number,
): Promise<number | null> {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT set_id FROM library_kpi WHERE id = ?",
    [libKpiId],
  );
  return rows.length ? Number(rows[0].set_id) : null;
}

/** Resolve the strategic set that owns a library metric (via its KPI). */
export async function setIdForMetric(
  conn: PoolConnection,
  libMetricId: number,
): Promise<number | null> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT k.set_id AS setId FROM library_metric m
       JOIN library_kpi k ON k.id = m.kpi_id WHERE m.id = ?`,
    [libMetricId],
  );
  return rows.length ? Number(rows[0].setId) : null;
}

/** Recompute every has_children KPI's roll-up across all quarters for a record,
 *  so computed values stay correct after weight/structure changes. */
export async function recomputeRecordRollups(conn: PoolConnection, recordId: number) {
  const [kpis] = await conn.query<RowDataPacket[]>(
    "SELECT id FROM perf_kpi WHERE record_id = ? AND has_children = 1",
    [recordId],
  );
  for (const k of kpis) {
    for (let year = 1; year <= 5; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        await recomputeKpiQuarter(conn, k.id, year, quarter);
      }
    }
  }
}

/** Re-sync every ACTIVE performance record activated from a set (definitions +
 *  targets + roll-ups). Called automatically after any library write. Closed /
 *  archived records are left frozen. No-op if setId is null. */
export async function syncActiveRecordsForSet(
  conn: PoolConnection,
  setId: number | null,
) {
  if (setId == null) return;
  const [records] = await conn.query<RowDataPacket[]>(
    "SELECT id FROM performance_record WHERE source_set_id = ? AND status = 'active'",
    [setId],
  );
  for (const r of records) {
    await syncRecordFromLibrary(conn, r.id);
    await recomputeRecordRollups(conn, r.id);
  }
}

/** True if any ACTIVE record has entered progress tied to this library KPI —
 *  either the KPI's own quarter progress or any of its metrics' progress
 *  (deleting the KPI would cascade the metrics and lose that data). */
export async function activeRecordsHaveKpiProgress(
  conn: PoolConnection,
  libKpiId: number,
): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT 1 FROM perf_kpi pk
       JOIN performance_record r ON r.id = pk.record_id AND r.status = 'active'
      WHERE pk.source_kpi_id = ?
        AND (
          EXISTS (SELECT 1 FROM perf_kpi_quarter_progress q WHERE q.perf_kpi_id = pk.id)
          OR EXISTS (
            SELECT 1 FROM perf_metric_quarter_progress mq
              JOIN perf_metric pm ON pm.id = mq.perf_metric_id
             WHERE pm.perf_kpi_id = pk.id
          )
        )
      LIMIT 1`,
    [libKpiId],
  );
  return rows.length > 0;
}

/** True if any ACTIVE record has entered progress tied to this library metric. */
export async function activeRecordsHaveMetricProgress(
  conn: PoolConnection,
  libMetricId: number,
): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT 1 FROM perf_metric pm
       JOIN perf_kpi pk ON pk.id = pm.perf_kpi_id
       JOIN performance_record r ON r.id = pk.record_id AND r.status = 'active'
       JOIN perf_metric_quarter_progress mq ON mq.perf_metric_id = pm.id
      WHERE pm.source_metric_id = ?
      LIMIT 1`,
    [libMetricId],
  );
  return rows.length > 0;
}
