// One-off migration: add the 'year_be' and 'month' data-source column types.
//
//   node --env-file=.env.local scripts/migrate-data-source-date-types.mjs
//
// Background. A CE year and a month used to be plain Number columns, so a
// Buddhist-era year (2569) or a month of 13 passed validation. The two new
// types are validated by lib/kpi/cellFormats.ts. Both store a number, so an
// existing Number column can be switched to them in Manage Columns without
// rewriting any recorded value.
//
// Only widens the data_type ENUM; no existing column changes type here.
// Idempotent: guarded on information_schema, safe to re-run.
import mysql from "mysql2/promise";

const NEW_TYPES = ["year_be", "month"];
const COLUMN_TYPE_DDL = `ENUM('text','url','number','date','select','boolean','faculty','program','curriculum','year_be','month') NOT NULL DEFAULT 'text'`;

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [rows] = await conn.query(
      `SELECT COLUMN_TYPE AS t FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'data_source_column'
          AND column_name = 'data_type'`,
    );
    const current = rows[0]?.t;
    if (!current) {
      console.error("data_source_column.data_type not found — run migrate-data-sources.mjs first.");
      process.exitCode = 1;
      return;
    }
    if (current.includes("'year_ce'")) {
      // This database predates Year (BE): narrowing the ENUM here would break
      // its year_ce columns. migrate-data-source-year-be.mjs converts them.
      console.log("data_source_column.data_type has year_ce — run migrate-data-source-year-be.mjs instead.");
      return;
    }
    const missing = NEW_TYPES.filter((t) => !current.includes(`'${t}'`));
    if (missing.length === 0) {
      console.log("data_source_column.data_type already has year_be and month — nothing to do.");
      return;
    }
    // DDL auto-commits in MySQL, so there is no transaction to wrap this in.
    console.log(`Adding data_source_column.data_type values: ${missing.join(", ")}…`);
    await conn.query(`ALTER TABLE data_source_column MODIFY COLUMN data_type ${COLUMN_TYPE_DDL}`);
    console.log("Migration complete. Switch existing year/month Number columns in Manage Columns.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
