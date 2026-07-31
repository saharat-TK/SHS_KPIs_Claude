// One-off cleanup: empty computed values the feed can no longer produce AND
// cannot reach, because their recording period is closed.
//
//   node --env-file=.env.local scripts/clear-stale-closed-period-values.mjs [--apply]
//
// Background. applyLink (lib/kpi/dataSourceFeed.ts) clears a computed value once
// its link stops producing one for that period — a source's rows get re-dated,
// and what was computed from the old dates is stranded. But clearing obeys the
// same guards as writing: a closed or approval-locked quarter is never touched
// in either direction, so orphans in closed periods stay put. On this database
// that is 60 rows across record 2 Y3Q1/Q2 and Y4Q1/Q2 — K2-1 reads 7% and 15%
// in Y3 beside two dashes, all of it computed from entries that now sit in 2566.
//
// Reopening those periods to let the feed run would be worse: the periods PUT
// stamps opened_by/opened_at, so the audit trail would then claim the quarters
// were reopened for recording when they never were. This script is the other
// way round — a human-run, explicitly-scoped act that leaves the recording-period
// history alone.
//
// The clearing SQL duplicates clearComputedQuarter rather than importing it:
// dataSourceFeed.ts has runtime "@/" imports and pulls in the MySQL pool, so a
// script cannot load it. Keep the two in step. recomputeKpiQuarter IS importable
// (type-only imports), exactly as recompute-parent-rollups.mjs relies on.
//
// Idempotent: a second run finds nothing.
import mysql from "mysql2/promise";
import { recomputeKpiQuarter } from "../lib/kpi/performance.ts";

const APPLY = process.argv.includes("--apply");
const YEARS = 5;
const QUARTERS = 4;

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [entries] = await conn.query(
      "SELECT data_source_id AS ds, year, quarter FROM data_source_entry",
    );
    // Mirrors entriesInWindow: cumulative within the year, annual rows from Q1.
    const windowHasRows = (ds, year, quarterNo) =>
      entries.some(
        (e) => e.ds === ds && e.year === year && (e.quarter == null || e.quarter <= quarterNo),
      );

    const [open] = await conn.query(
      "SELECT record_id AS rec, year_no AS y, quarter_no AS q FROM performance_record_period WHERE is_open = 1",
    );
    const isOpen = (rec, y, q) => open.some((o) => o.rec === rec && o.y === y && o.q === q);

    // Every target a link feeds, with the source and record span it reads.
    const [metricTargets] = await conn.query(
      `SELECT pm.id AS targetId, pm.name, pm.perf_kpi_id AS perfKpiId,
              l.data_source_id AS ds, r.start_year AS startYear, r.id AS rec
         FROM data_source_link l
         JOIN library_metric lm ON lm.id = l.library_metric_id
         JOIN perf_metric pm ON pm.source_metric_id = lm.id
         JOIN perf_kpi pk ON pk.id = pm.perf_kpi_id
         JOIN performance_record r ON r.id = pk.record_id AND r.status = 'active'
        WHERE l.mappings IS NOT NULL`,
    );
    const [kpiTargets] = await conn.query(
      `SELECT pk.id AS targetId, pk.name, pk.id AS perfKpiId,
              l.data_source_id AS ds, r.start_year AS startYear, r.id AS rec
         FROM data_source_link l
         JOIN perf_kpi pk ON pk.source_kpi_id = l.library_kpi_id
         JOIN performance_record r ON r.id = pk.record_id AND r.status = 'active'
        WHERE l.mappings IS NOT NULL AND l.library_kpi_id IS NOT NULL`,
    );

    const stale = [];
    for (const [targets, kind] of [
      [metricTargets, "metric"],
      [kpiTargets, "kpi"],
    ]) {
      for (const t of targets) {
        for (let y = 1; y <= YEARS; y += 1) {
          for (let q = 1; q <= QUARTERS; q += 1) {
            // Only what the feed declined: no rows to compute from, and the
            // period closed so applyLink's own clearing could not reach it.
            if (windowHasRows(t.ds, t.startYear + y - 1, q)) continue;
            if (isOpen(t.rec, y, q)) continue;

            const table =
              kind === "metric" ? "perf_metric_quarter_progress" : "perf_kpi_quarter_progress";
            const idCol = kind === "metric" ? "perf_metric_id" : "perf_kpi_id";
            const [rows] = await conn.query(
              `SELECT 1 FROM ${table}
                WHERE ${idCol} = ? AND year_no = ? AND quarter_no = ?
                  AND is_computed = 1 AND progress_value IS NOT NULL`,
              [t.targetId, y, q],
            );
            if (rows.length > 0) {
              stale.push({ kind, ...t, y, q, table, idCol });
            }
          }
        }
      }
    }

    if (stale.length === 0) {
      console.log("Nothing to do — no computed values stranded in closed periods.");
      return;
    }

    const byPeriod = new Map();
    for (const s of stale) {
      const key = `record ${s.rec} Y${s.y}Q${s.q}`;
      byPeriod.set(key, (byPeriod.get(key) ?? 0) + 1);
    }
    console.log(`${stale.length} computed value(s) stranded in closed periods:`);
    for (const [period, n] of [...byPeriod.entries()].sort()) {
      console.log(`  ${period}: ${n} row(s)`);
    }

    if (!APPLY) {
      console.log(
        "\nRe-run with --apply to clear them. Hand-entered rows (is_computed = 0) " +
          "are never touched, and issue/solution stay on the row.",
      );
      return;
    }

    // Parents whose children changed, so the roll-up follows them down. A
    // link-owned parent no-ops in recomputeKpiQuarter (rollsUpFromChildren) and
    // is handled by its own entry in `stale`.
    const toRecompute = new Set();
    let cleared = 0;
    for (const s of stale) {
      const extra = s.kind === "kpi" ? ", value_source = 'data_source'" : "";
      const [res] = await conn.query(
        `UPDATE ${s.table}
            SET progress_value = NULL, variable1_value = NULL, variable2_value = NULL${extra}
          WHERE ${s.idCol} = ? AND year_no = ? AND quarter_no = ?
            AND is_computed = 1 AND progress_value IS NOT NULL`,
        [s.targetId, s.y, s.q],
      );
      cleared += res.affectedRows;
      if (s.kind === "metric" && res.affectedRows > 0) {
        toRecompute.add(`${s.perfKpiId}:${s.y}:${s.q}`);
      }
    }

    for (const key of toRecompute) {
      const [perfKpiId, y, q] = key.split(":").map(Number);
      await recomputeKpiQuarter(conn, perfKpiId, y, q);
    }

    console.log(
      `\nCleared ${cleared} row(s); recomputed ${toRecompute.size} parent quarter(s).`,
    );
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
