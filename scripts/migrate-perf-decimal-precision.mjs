// One-off migration: restore DECIMAL(14,4) precision on the perf_* value columns.
//
//   node --env-file=.env.local scripts/migrate-perf-decimal-precision.mjs
//
// Background. Every library_* decimal column is DECIMAL(14,4), and so are both
// perf_*_annual_target.target_value columns — but the ten perf_* columns below
// were created in the live DB as DECIMAL(14,2), diverging from
// schema/SHS_KPI_Management_schema.sql which declares them (14,4).
//
// Why it matters: perf_kpi / perf_metric rows are COPIED from their library_*
// counterparts. A library KPI with threshold_green = 2.3333 silently truncates
// to 2.33 the moment it is copied into a performance record, so the two sides of
// the same comparison disagree. Widening is lossless and re-runnable.
//
// Note: values already truncated to 2dp stay truncated — widening the column
// cannot recover digits that were never stored. Re-copy from library_* if exact
// values matter for existing rows.
import mysql from "mysql2/promise";

// [table, column] — every perf_* column the schema file declares DECIMAL(14,4).
// All ten are nullable with no default, so MODIFY restates the full definition.
const TARGETS = [
  ["perf_kpi", "five_year_target"],
  ["perf_kpi", "threshold_green"],
  ["perf_kpi", "threshold_amber"],
  ["perf_kpi_quarter_progress", "progress_value"],
  ["perf_kpi_quarter_progress", "variable1_value"],
  ["perf_kpi_quarter_progress", "variable2_value"],
  ["perf_metric", "five_year_target"],
  ["perf_metric", "threshold_green"],
  ["perf_metric", "threshold_amber"],
  ["perf_metric_quarter_progress", "progress_value"],
];

const WANT = "decimal(14,4)";

async function columnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows[0]?.t ?? null;
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
    let changed = 0;
    let skipped = 0;
    for (const [table, column] of TARGETS) {
      const t = await columnType(conn, table, column);
      if (t == null) {
        console.warn(`! ${table}.${column} does not exist — skipping.`);
        continue;
      }
      // Guard on the actual type so the ALTER is safe to re-run. DDL auto-commits
      // in MySQL, so there is no transaction to wrap this in.
      if (t.replace(/\s+/g, "").toLowerCase() === WANT) {
        skipped += 1;
        continue;
      }
      console.log(`Widening ${table}.${column} (${t} → DECIMAL(14,4))…`);
      await conn.query(
        `ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` DECIMAL(14,4) NULL`,
      );
      changed += 1;
    }
    console.log(`Migration complete. ${changed} column(s) widened, ${skipped} already correct.`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
