// One-off migration: add data_source_entry.is_incomplete.
//
//   node --env-file=.env.local scripts/migrate-data-source-entry-incomplete.mjs
//
// Background. A CSV import can now keep rows whose required cells are empty
// ("Import anyway with flag"), and an edit can be saved still incomplete. Those
// rows are flagged here so the KPI feed (lib/kpi/dataSourceFeed.ts) skips them
// until someone fills the cells in; saving the completed row clears the flag.
//
// The flag is stored, not derived from the columns, on purpose: a column that
// is marked Required after rows were recorded must not silently pull those rows
// out of every KPI. Every existing row therefore keeps is_incomplete = 0 and
// nothing is backfilled.
//
// Additive and idempotent: guarded on information_schema, safe to re-run, and
// the previous code simply ignores the extra column.
import mysql from "mysql2/promise";

const TABLE = "data_source_entry";
const COLUMN = "is_incomplete";

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
    if (await columnExists(conn, TABLE, COLUMN)) {
      console.log(`${TABLE}.${COLUMN} already exists — nothing to do.`);
      return;
    }

    // DDL auto-commits in MySQL, so there is no transaction to wrap this in.
    console.log(`Adding ${TABLE}.${COLUMN}…`);
    await conn.query(
      `ALTER TABLE \`${TABLE}\`
         ADD COLUMN \`${COLUMN}\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`note\``,
    );
    console.log("Migration complete. Existing rows keep is_incomplete = 0 (counted).");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
