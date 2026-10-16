// One-off migration: link library sub-KPIs to the academic catalog entry
// (program or curriculum) they were batch-created for.
//
//   node --env-file=.env.local scripts/migrate-metric-catalog-code.mjs
//
// Idempotent. Adds `catalog_code` to library_metric — the program/curriculum
// code ("PH", "PHB") — so the sub-KPI batch matches existing rows by code
// rather than by name, and offers a rename when a catalog label_th changes.
// No FK: removing a curriculum must not touch KPIs.
//
// Backfills unlinked rows the batch can still recognise by name: the old
// `${code}-${parent}` format (any text after the hyphen), or a name equal to a
// current label_th.
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

    if ((await columnType(conn, "library_metric", "catalog_code")) == null) {
      console.log("Adding library_metric.catalog_code…");
      await conn.query(
        "ALTER TABLE library_metric ADD COLUMN catalog_code VARCHAR(20) NULL AFTER name",
      );
    } else {
      console.log("library_metric.catalog_code already present.");
    }

    // Binary collation: codes are case-sensitive ("PH-" must not match "ph-"),
    // and the hyphen keeps "PH-" off "PHB-…".
    const [res] = await conn.query(
      `UPDATE library_metric m
         JOIN (SELECT code, label_th FROM academic_program
               UNION ALL
               SELECT code, label_th FROM curriculum) cat
           ON m.name COLLATE utf8mb4_bin LIKE CONCAT(cat.code, '-%') COLLATE utf8mb4_bin
           OR m.name COLLATE utf8mb4_bin = cat.label_th COLLATE utf8mb4_bin
          SET m.catalog_code = cat.code
        WHERE m.catalog_code IS NULL`,
    );
    console.log(`Linked ${res.affectedRows} existing sub-KPI(s) to a catalog code.`);

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
