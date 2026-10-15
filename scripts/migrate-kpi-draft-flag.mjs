// One-off migration: add library_kpi.is_draft.
//
//   node --env-file=.env.local scripts/migrate-kpi-draft-flag.mjs
//
// Background. A KPI created from the set page (single Add KPI or Batch Add) is
// a skeleton until someone configures it in the KPI editor. is_draft marks that
// state: the set list and the editor show a "D" badge, and the library-to-
// performance sync (lib/kpi/performance.ts) skips drafts so an unconfigured KPI
// never lands in a live performance record. The editor's first Save clears it.
//
// Every existing KPI is already configured and already synced, so the column
// defaults to 0 (published) and nothing is backfilled.
//
// Idempotent: guarded on information_schema, safe to re-run.
import mysql from "mysql2/promise";

const TABLE = "library_kpi";
const COLUMN = "is_draft";

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
         ADD COLUMN \`${COLUMN}\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`sort_order\``,
    );
    console.log("Migration complete. Existing KPIs keep is_draft = 0 (published).");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
