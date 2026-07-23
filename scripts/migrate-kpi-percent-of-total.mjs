// One-off migration: add the 'percent_of_total' calculation type.
//
//   node --env-file=.env.local scripts/migrate-kpi-percent-of-total.mjs
//
// Idempotent. Steps:
//   1. Extend the calculation_type ENUM on library_kpi and perf_kpi.
//   2. Stamp existing Percent-unit KPIs onto 'percent_of_total'.
//
// Why step 2: rollup() used to short-circuit on unit='Percent' and ignore
// calculation_type entirely, so those KPIs never really used the type they had
// stored. That short-circuit is gone — without this backfill they would fall
// through to weighted_sum/simple_average and roll up raw percentages, which is
// meaningless. custom_formula KPIs are left alone (their formula still governs).
//
// Note: previously-computed perf_kpi_quarter_progress values were produced by
// the old average-of-ratios rule and are NOT rewritten here. They are recomputed
// on the next progress write to any child metric.
import mysql from "mysql2/promise";

const ENUM_DEF =
  "ENUM('weighted_sum','simple_average','percent_of_total','custom_formula') NOT NULL DEFAULT 'weighted_sum'";

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
    multipleStatements: true,
  });
  try {
    // 1. Extend both ENUMs. DDL auto-commits in MySQL, so each step is guarded
    // separately rather than wrapped in a transaction.
    for (const table of ["library_kpi", "perf_kpi"]) {
      const t = await columnType(conn, table, "calculation_type");
      if (t == null) {
        throw new Error(`${table}.calculation_type not found — is this the right database?`);
      }
      if (t.includes("percent_of_total")) {
        console.log(`${table}.calculation_type already has percent_of_total — skipping.`);
        continue;
      }
      console.log(`Extending ${table}.calculation_type ENUM…`);
      await conn.query(`ALTER TABLE ${table} MODIFY COLUMN calculation_type ${ENUM_DEF}`);
    }

    // 2. Backfill. Must run after the ALTER or the value is rejected.
    for (const table of ["library_kpi", "perf_kpi"]) {
      const [res] = await conn.query(
        `UPDATE ${table} SET calculation_type = 'percent_of_total'
          WHERE LOWER(TRIM(unit)) = 'percent'
            AND calculation_type NOT IN ('custom_formula', 'percent_of_total')`,
      );
      console.log(`${table}: moved ${res.affectedRows} Percent KPIs to percent_of_total.`);
    }

    console.log("Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
