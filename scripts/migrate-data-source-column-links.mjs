// One-off migration: add the column-link settings to data_source_column.
//
//   node --env-file=.env.local scripts/migrate-data-source-column-links.mjs
//
// Background. A data-source cell is a single value, so one paper with three
// SHS authors is recorded as three rows. These settings let the entry form do
// that split itself (lib/kpi/columnLinks.ts):
//   ref_col_key  — this column is "ref by" another (e.g. a faculty column ref
//                  by a program column): picking a program narrows the faculty
//                  list, picking a faculty fills in their program.
//   is_multiple  — the form takes several values for this column and saves one
//                  row per value. At most one per data source.
//   auto_fill    — 'share' fills a number column with 1/n of those rows.
//
// Every existing column keeps today's behaviour: no ref, single, no auto-fill.
//
// Idempotent: guarded on information_schema, safe to re-run.
import mysql from "mysql2/promise";

const TABLE = "data_source_column";

const COLUMNS = [
  ["ref_col_key", "VARCHAR(40) NULL AFTER `options`"],
  ["is_multiple", "TINYINT(1) NOT NULL DEFAULT 0 AFTER `ref_col_key`"],
  ["auto_fill", "VARCHAR(20) NULL AFTER `is_multiple`"],
];

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
    let added = 0;
    // DDL auto-commits in MySQL, so there is no transaction to wrap this in.
    // Columns are added in order because each one is placed AFTER the last.
    for (const [column, ddl] of COLUMNS) {
      if (await columnExists(conn, TABLE, column)) {
        console.log(`${TABLE}.${column} already exists — skipped.`);
        continue;
      }
      console.log(`Adding ${TABLE}.${column}…`);
      await conn.query(`ALTER TABLE \`${TABLE}\` ADD COLUMN \`${column}\` ${ddl}`);
      added += 1;
    }
    console.log(
      added === 0
        ? "Nothing to do."
        : `Migration complete (${added} column(s) added). Existing columns keep no ref, single value, no auto-fill.`,
    );
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
