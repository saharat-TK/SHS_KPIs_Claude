// One-off migration: add curriculum.degree_level and fill it for the catalog.
//
//   node --env-file=.env.local scripts/migrate-curriculum-degree-level.mjs
//
// Background. Data sources that record per curriculum often also carry a
// "Degree level" select column (Bachelor's / Master's / Doctoral). Each
// curriculum has exactly one level, so the data-entry form fills that column in
// from the catalog (lib/kpi/batchEntry.ts#degreeLevelFor) instead of asking for
// it nine times. The values match the admissions source's select options.
//
// Idempotent: the column is added only when missing, and the backfill only
// touches rows whose level is still NULL, so a hand-corrected level survives a
// re-run.
import mysql from "mysql2/promise";

const TABLE = "curriculum";
const COLUMN = "degree_level";

const LEVELS = {
  PHB: "Bachelor's",
  SHSB: "Bachelor's",
  OHSB: "Bachelor's",
  EnvHB: "Bachelor's",
  PHM: "Master's",
  SHSM: "Master's",
  EnvHM: "Master's",
  BMM: "Master's",
  PHD: "Doctoral",
};

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
      console.log(`${TABLE}.${COLUMN} already exists.`);
    } else {
      // DDL auto-commits in MySQL, so there is no transaction to wrap this in.
      console.log(`Adding ${TABLE}.${COLUMN}…`);
      await conn.query(
        `ALTER TABLE \`${TABLE}\`
           ADD COLUMN \`${COLUMN}\` VARCHAR(20) NULL AFTER \`label_th\``,
      );
    }

    let filled = 0;
    for (const [code, level] of Object.entries(LEVELS)) {
      const [res] = await conn.query(
        `UPDATE ${TABLE} SET ${COLUMN} = ? WHERE code = ? AND ${COLUMN} IS NULL`,
        [level, code],
      );
      filled += res.affectedRows;
    }
    const [missing] = await conn.query(
      `SELECT code FROM ${TABLE} WHERE ${COLUMN} IS NULL ORDER BY sort_order`,
    );
    console.log(`Filled ${filled} curriculum level(s).`);
    if (missing.length > 0) {
      console.log(`Still without a level: ${missing.map((r) => r.code).join(", ")}`);
    }
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
