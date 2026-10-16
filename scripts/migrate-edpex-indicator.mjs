// One-off migration: the optional EdPEx indicator code on KPIs — the numbered
// row in the School's EdPEx SAR a KPI reports on ("7.1ข-4", "7.5ก-2-3").
//
//   node --env-file=.env.local scripts/migrate-edpex-indicator.mjs
//
// Idempotent. Adds `edpex_indicator_code` to library_kpi and perf_kpi, after
// edpex_area_id (run scripts/migrate-edpex.mjs first). Free text, no FK: the
// SAR's row numbers are not a managed list. Existing KPIs stay blank.
import mysql from "mysql2/promise";

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
    await conn.query("SET NAMES utf8mb4");

    for (const table of ["library_kpi", "perf_kpi"]) {
      if ((await columnType(conn, table, "edpex_area_id")) == null) {
        throw new Error(
          `${table}.edpex_area_id is missing — run scripts/migrate-edpex.mjs first`,
        );
      }
      if ((await columnType(conn, table, "edpex_indicator_code")) == null) {
        console.log(`Adding ${table}.edpex_indicator_code…`);
        await conn.query(
          `ALTER TABLE ${table} ADD COLUMN edpex_indicator_code VARCHAR(30) NULL AFTER edpex_area_id`,
        );
      } else {
        console.log(`${table}.edpex_indicator_code already present.`);
      }
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
