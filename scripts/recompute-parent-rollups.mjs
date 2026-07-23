// One-off backfill: recompute every has_children KPI's stored quarter roll-up.
//
//   node --env-file=.env.local scripts/recompute-parent-rollups.mjs
//
// Why: rollup() now falls back to a plain sum of child values when a
// ratio_of_total / percent_of_total KPI has no usable metric targets (before,
// it returned null and the parent showed "—"). Existing perf_kpi_quarter_progress
// rows were written under the old rule, so they stay stale until the next feed.
// This rewrites them by reusing the real recomputeKpiQuarter — no logic is
// duplicated here. Idempotent: recompute is an upsert.
//
// Node strips the type-only imports in performance.ts at runtime, exactly as
// tests/kpiRollup.test.mjs already imports that module.
import mysql from "mysql2/promise";
import { recomputeKpiQuarter } from "../lib/kpi/performance.ts";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [kpis] = await conn.query(
      "SELECT id FROM perf_kpi WHERE has_children = 1",
    );
    let recomputed = 0;
    for (const { id } of kpis) {
      // Only the (year, quarter) pairs that actually have metric progress —
      // recomputing empty quarters would just stamp spurious NULL rows.
      const [periods] = await conn.query(
        `SELECT DISTINCT p.year_no AS yearNo, p.quarter_no AS quarterNo
           FROM perf_metric_quarter_progress p
           JOIN perf_metric m ON m.id = p.perf_metric_id
          WHERE m.perf_kpi_id = ?`,
        [id],
      );
      for (const { yearNo, quarterNo } of periods) {
        await recomputeKpiQuarter(conn, Number(id), Number(yearNo), Number(quarterNo));
        recomputed += 1;
      }
    }
    console.log(
      `Backfill complete: ${recomputed} quarter(s) recomputed across ${kpis.length} parent KPI(s).`,
    );
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
