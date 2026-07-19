// One-off migration: add the 'ratio_of_total' calculation type.
//
//   node --env-file=.env.local scripts/migrate-kpi-ratio-of-total.mjs
//
// Idempotent. DDL only — extends the calculation_type ENUM on library_kpi and
// perf_kpi. Deliberately has NO backfill step.
//
// Why no backfill (unlike migrate-kpi-percent-of-total.mjs): that migration
// moved unit='Percent' KPIs onto percent_of_total to PRESERVE behaviour, because
// rollup() used to short-circuit on unit='percent' and ignore calculation_type.
// That short-circuit only ever matched 'percent' — unit='Ratio' KPIs were never
// on it and have genuinely been rolling up as weighted_sum/simple_average. So
// flipping them here would silently change their numbers, not preserve them.
// Existing Ratio KPIs stay put until someone opens one and chooses.
import mysql from "mysql2/promise";

const ENUM_DEF =
  "ENUM('weighted_sum','simple_average','percent_of_total','ratio_of_total','custom_formula') NOT NULL DEFAULT 'weighted_sum'";

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
    for (const table of ["library_kpi", "perf_kpi"]) {
      const t = await columnType(conn, table, "calculation_type");
      if (t == null) {
        throw new Error(`${table}.calculation_type not found — is this the right database?`);
      }
      if (t.includes("ratio_of_total")) {
        console.log(`${table}.calculation_type already has ratio_of_total — skipping.`);
        continue;
      }
      console.log(`Extending ${table}.calculation_type ENUM…`);
      await conn.query(`ALTER TABLE ${table} MODIFY COLUMN calculation_type ${ENUM_DEF}`);
    }
    console.log("Done. No rows changed (DDL only, by design).");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
