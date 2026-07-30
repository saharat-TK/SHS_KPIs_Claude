// One-off backfill: populate variable1_value / variable2_value on KPI quarter
// rows that were written before every engine recorded them.
//
//   node --env-file=.env.local scripts/backfill-kpi-quarter-variables.mjs
//
// Run scripts/migrate-kpi-value-source.mjs first — this script assumes the
// value_source column exists.
//
// Why: the parent roll-up never wrote the variable columns at all, and a
// data-source link mapped to the single "value" slot wrote only the result. Both
// now store the numerator/denominator they divided, but existing rows stay bare
// until something rewrites them.
//
// What it covers:
//   1. Roll-ups — reruns the real recomputeKpiQuarter, so no logic is duplicated
//      here. Node strips the type-only imports in performance.ts at runtime,
//      exactly as tests/kpiRollup.test.mjs and recompute-parent-rollups.mjs do.
//   2. Legacy manual leaf rows — a KPI that never declared variable1_name stored
//      only progress_value; the progress PUT route now mirrors it into
//      variable1_value, so match that for the rows already saved.
//   3. Data sources — NOT covered here. lib/kpi/dataSourceFeed.ts imports its
//      dependencies through the "@/..." path alias, which bare Node cannot
//      resolve, so it cannot be imported the way performance.ts can. With the
//      dev server running, set BASE_URL and this script will POST to the
//      existing /api/performance-records/:id/recompute-from-sources endpoint for
//      each active record — the same thing the "Recompute from sources" button
//      does. Without BASE_URL it just prints the record ids to do by hand.
//
// Limits: the feed deliberately skips approval-locked quarters and closed
// recording periods, so approved quarters keep their null variables. That is
// correct — backfilling them would rewrite approved data.
//
// Idempotent: every step is an upsert or a null-guarded update.
import mysql from "mysql2/promise";
import { recomputeKpiQuarter } from "../lib/kpi/performance.ts";

async function backfillRollups(conn) {
  const [kpis] = await conn.query("SELECT id FROM perf_kpi WHERE has_children = 1");
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
    `1. Roll-ups: ${recomputed} quarter(s) recomputed across ${kpis.length} parent KPI(s).`,
  );
}

async function backfillLegacyManual(conn) {
  const [res] = await conn.query(
    `UPDATE perf_kpi_quarter_progress q
       JOIN perf_kpi k ON k.id = q.perf_kpi_id
        SET q.variable1_value = q.progress_value
      WHERE q.value_source = 'manual'
        AND q.variable1_value IS NULL
        AND q.progress_value IS NOT NULL
        AND k.variable1_name IS NULL`,
  );
  console.log(`2. Legacy manual rows: ${res.affectedRows} row(s) given a Variable 1.`);
}

async function backfillDataSources(conn) {
  const [records] = await conn.query(
    "SELECT id, name FROM performance_record WHERE status = 'active'",
  );
  const baseUrl = process.env.BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    console.log(
      `3. Data sources: skipped. Set BASE_URL (e.g. http://localhost:3000) to run this ` +
        `step, or click "Recompute from sources" on each active record:\n` +
        records.map((r) => `     - #${r.id} ${r.name}`).join("\n"),
    );
    return;
  }
  for (const r of records) {
    const res = await fetch(
      `${baseUrl}/api/performance-records/${r.id}/recompute-from-sources`,
      { method: "POST" },
    );
    const body = await res.json();
    if (!res.ok) {
      console.warn(`   ! #${r.id} ${r.name}: ${body.error ?? res.statusText}`);
      continue;
    }
    console.log(`   #${r.id} ${r.name}: ${body.summary}`);
  }
  console.log(`3. Data sources: ${records.length} active record(s) refed.`);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    await backfillRollups(conn);
    await backfillLegacyManual(conn);
    await backfillDataSources(conn);
    console.log("Backfill complete.");
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
