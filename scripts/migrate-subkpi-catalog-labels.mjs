// One-off migration: migrate existing sub-KPI names in library_metric and
// perf_metric to the official Thai labels (label_th) from the 5 academic
// programs and 9 curricula in the academic catalog.
//
// Also ensures perf_metric has a catalog_code column and populates it.
//
//   node --env-file=.env.local scripts/migrate-subkpi-catalog-labels.mjs
//
// Idempotent and safe to re-run.
import mysql from "mysql2/promise";

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
    await conn.query("SET NAMES utf8mb4");

    // 1. Ensure perf_metric has catalog_code column
    if (!(await columnExists(conn, "perf_metric", "catalog_code"))) {
      console.log("Adding perf_metric.catalog_code column…");
      await conn.query(
        "ALTER TABLE perf_metric ADD COLUMN catalog_code VARCHAR(20) NULL AFTER name",
      );
    } else {
      console.log("perf_metric.catalog_code column already present.");
    }

    // 2. Populate perf_metric.catalog_code from library_metric (source_metric_id)
    const [pmLinkFromLib] = await conn.query(`
      UPDATE perf_metric pm
        JOIN library_metric lm ON pm.source_metric_id = lm.id
         SET pm.catalog_code = lm.catalog_code
       WHERE lm.catalog_code IS NOT NULL
         AND pm.catalog_code IS NULL
    `);
    console.log(
      `Linked ${pmLinkFromLib.affectedRows} perf_metric row(s) to catalog_code from library_metric.`,
    );

    // 3. Fallback link for perf_metric rows by code prefix (e.g. 'PHB-%')
    const [pmLinkByPrefix] = await conn.query(`
      UPDATE perf_metric pm
        JOIN (SELECT code, label_th FROM academic_program
              UNION ALL
              SELECT code, label_th FROM curriculum) cat
          ON pm.name COLLATE utf8mb4_bin LIKE CONCAT(cat.code, '-%') COLLATE utf8mb4_bin
          OR pm.name COLLATE utf8mb4_bin = cat.label_th COLLATE utf8mb4_bin
         SET pm.catalog_code = cat.code
       WHERE pm.catalog_code IS NULL
    `);
    console.log(
      `Linked ${pmLinkByPrefix.affectedRows} additional perf_metric row(s) to catalog_code by name prefix.`,
    );

    // 4. Update library_metric names to the clean label_th
    const [lmRenamed] = await conn.query(`
      UPDATE library_metric m
        JOIN (SELECT code, label_th FROM academic_program
              UNION ALL
              SELECT code, label_th FROM curriculum) cat
          ON m.catalog_code COLLATE utf8mb4_bin = cat.code COLLATE utf8mb4_bin
         SET m.name = cat.label_th
       WHERE m.name != cat.label_th
    `);
    console.log(
      `Updated ${lmRenamed.affectedRows} library_metric row(s) to official Thai catalog labels.`,
    );

    // 5. Update perf_metric names to the clean label_th
    const [pmRenamed] = await conn.query(`
      UPDATE perf_metric pm
        JOIN (SELECT code, label_th FROM academic_program
              UNION ALL
              SELECT code, label_th FROM curriculum) cat
          ON pm.catalog_code COLLATE utf8mb4_bin = cat.code COLLATE utf8mb4_bin
         SET pm.name = cat.label_th
       WHERE pm.name != cat.label_th
    `);
    console.log(
      `Updated ${pmRenamed.affectedRows} perf_metric row(s) to official Thai catalog labels.`,
    );

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
