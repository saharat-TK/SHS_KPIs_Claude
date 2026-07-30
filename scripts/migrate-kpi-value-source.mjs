// One-off migration: add perf_kpi_quarter_progress.value_source.
//
//   node --env-file=.env.local scripts/migrate-kpi-value-source.mjs
//
// Background. Three engines write a KPI quarter row — the manual progress PUT
// route, the parent roll-up (lib/kpi/performance.ts) and the data-source feed
// (lib/kpi/dataSourceFeed.ts) — and all three now record the numerator and
// denominator they used in variable1_value / variable2_value. But is_computed
// is a single boolean: it says "not hand-entered" and conflates the roll-up
// with the feed, so a stored variable pair carries no record of which engine
// produced it, and nothing can tell whether kpiValueFromVariables() may be
// applied to it (it may not — see lib/kpi/performance.ts#rollupParts).
//
// value_source closes that gap. Existing computed rows are backfilled to
// 'rollup' because that is the safe reading: a roll-up row is recomputed from
// its metrics on the next write, whereas mislabelling a roll-up as a feed would
// suggest provenance that does not exist. Data-source rows are corrected when
// the feed next runs — scripts/backfill-kpi-quarter-variables.mjs walks that.
//
// Idempotent: guarded on information_schema, safe to re-run.
import mysql from "mysql2/promise";

const TABLE = "perf_kpi_quarter_progress";
const COLUMN = "value_source";

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
         ADD COLUMN \`${COLUMN}\` ENUM('manual','rollup','data_source')
         NOT NULL DEFAULT 'manual' AFTER \`is_computed\``,
    );

    const [res] = await conn.query(
      `UPDATE ${TABLE} SET ${COLUMN} = 'rollup' WHERE is_computed = 1`,
    );
    console.log(
      `Migration complete. ${res.affectedRows} existing computed row(s) marked 'rollup'; ` +
        `every other row keeps the 'manual' default.`,
    );
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
