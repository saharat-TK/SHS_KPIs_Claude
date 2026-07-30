// One-off migration: add perf_metric_quarter_progress.variable1_value /
// variable2_value.
//
//   node --env-file=.env.local scripts/migrate-metric-quarter-variables.mjs
//
// Background. perf_kpi_quarter_progress has recorded the numerator and
// denominator behind every computed value since the value_source migration, so a
// fed KPI reads as "96 of 120 → 80%". The metric table had no such columns, and
// the feed threw the pair away (lib/kpi/dataSourceFeed.ts) — a fed sub-KPI showed
// a bare number with no visible basis. These two columns close that gap.
//
// No value_source column here: that exists on the KPI table because three
// engines write it and is_computed cannot separate the roll-up from the feed. A
// metric is a leaf with two writers (the manual PUT, the feed), and is_computed
// already tells them apart.
//
// No backfill either. The numerator/denominator can only come from re-running
// the aggregation, and there is already a button for that: "recompute from
// sources" on a performance record (feedRecord in lib/kpi/dataSourceFeed.ts)
// refills every fed row of that record. Existing rows read NULL — and so render
// exactly as they do today — until that runs or the source data next changes.
//
// Idempotent: guarded on information_schema, safe to re-run.
import mysql from "mysql2/promise";

const TABLE = "perf_metric_quarter_progress";
const COLUMNS = ["variable1_value", "variable2_value"];

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows.length > 0;
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
    // Added one at a time, each with its own guard: a half-applied run (the
    // first column added, the second failed) must still complete on a re-run.
    let added = 0;
    let after = "progress_value";
    for (const column of COLUMNS) {
      if (await columnExists(conn, TABLE, column)) {
        console.log(`${TABLE}.${column} already exists — skipping.`);
        after = column;
        continue;
      }
      // DDL auto-commits in MySQL, so there is no transaction to wrap this in.
      console.log(`Adding ${TABLE}.${column}…`);
      await conn.query(
        `ALTER TABLE \`${TABLE}\`
           ADD COLUMN \`${column}\` DECIMAL(14,4) NULL AFTER \`${after}\``,
      );
      after = column;
      added += 1;
    }

    console.log(
      added === 0
        ? "Nothing to do — both columns were already present."
        : `Migration complete. ${added} column(s) added. Existing rows read NULL; ` +
            `use "recompute from sources" on each active record to fill the fed ones.`,
    );
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
