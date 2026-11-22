// One-off migration: the 'year_ce' column type becomes 'year_be' (Year (BE)).
//
//   node --env-file=.env.local scripts/migrate-data-source-year-be.mjs
//
// Background. Year columns were CE (2026); years in this system are Buddhist
// era everywhere else (entry periods, performance records), so they are now BE
// (2569) and a CE year is rejected with a hint (lib/kpi/cellFormats.ts).
//
// Steps, each guarded so the script is safe to re-run:
//   1. widen data_source_column.data_type to accept 'year_be';
//   2. in one transaction, switch every 'year_ce' column to 'year_be' and add
//      543 to each of its cells that is still a CE year (< 2400) — a cell that
//      is already BE (>= 2400) is left as it is;
//   3. narrow the ENUM again, dropping 'year_ce'.
// A KPI link that filters on such a column is reported, to update by hand.
import mysql from "mysql2/promise";

const BE_OFFSET = 543;
const BE_YEAR_FROM = 2400;
const BASE = `'text','url','number','date','select','boolean','faculty','program','curriculum'`;
const WIDE_DDL = `ENUM(${BASE},'year_ce','year_be','month') NOT NULL DEFAULT 'text'`;
const FINAL_DDL = `ENUM(${BASE},'year_be','month') NOT NULL DEFAULT 'text'`;

async function columnType(conn) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'data_source_column'
        AND column_name = 'data_type'`,
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
    const current = await columnType(conn);
    if (!current) {
      console.error("data_source_column.data_type not found — run migrate-data-sources.mjs first.");
      process.exitCode = 1;
      return;
    }
    if (!current.includes("'year_ce'") && current.includes("'year_be'")) {
      console.log("data_source_column.data_type already uses year_be — nothing to do.");
      return;
    }

    // 1. DDL auto-commits in MySQL, so it sits outside the data transaction.
    if (!current.includes("'year_be'")) {
      console.log("Adding 'year_be' to data_source_column.data_type…");
      await conn.query(`ALTER TABLE data_source_column MODIFY COLUMN data_type ${WIDE_DDL}`);
    }

    // 2. Switch the columns and convert their CE cells to BE.
    const [columns] = await conn.query(
      `SELECT c.id, c.data_source_id AS ds, c.col_key AS colKey, c.label, d.name
         FROM data_source_column c JOIN data_source d ON d.id = c.data_source_id
        WHERE c.data_type = 'year_ce'`,
    );
    await conn.beginTransaction();
    try {
      let converted = 0;
      for (const col of columns) {
        const path = `$.${col.colKey}`;
        const [cells] = await conn.query(
          `SELECT id, JSON_UNQUOTE(JSON_EXTRACT(values_json, ?)) AS v
             FROM data_source_entry WHERE data_source_id = ?`,
          [path, col.ds],
        );
        let n = 0;
        for (const { id, v } of cells) {
          const year = Number(v);
          if (v === null || v === "null" || !Number.isInteger(year) || year >= BE_YEAR_FROM) continue;
          await conn.query(
            "UPDATE data_source_entry SET values_json = JSON_SET(values_json, ?, ?) WHERE id = ?",
            [path, year + BE_OFFSET, id],
          );
          n += 1;
        }
        await conn.query("UPDATE data_source_column SET data_type = 'year_be' WHERE id = ?", [col.id]);
        console.log(`${col.name} › ${col.label}: now Year (BE), ${n} of ${cells.length} cells converted to BE`);
        converted += n;
      }
      await conn.commit();
      console.log(`Switched ${columns.length} column(s); converted ${converted} cell(s).`);
    } catch (err) {
      await conn.rollback();
      throw err;
    }

    // A link filter on a converted column would now compare against BE values.
    const keys = new Set(columns.map((c) => `${c.ds}:${c.colKey}`));
    const [links] = await conn.query("SELECT id, data_source_id AS ds, mappings FROM data_source_link");
    for (const l of links) {
      const maps = typeof l.mappings === "string" ? JSON.parse(l.mappings) : (l.mappings ?? []);
      for (const mp of maps) {
        for (const f of [...(mp.filters ?? []), ...(mp.numeratorFilters ?? [])]) {
          if (keys.has(`${l.ds}:${f.field}`)) {
            console.log(`  link #${l.id} filters on "${f.field}" — update its year to BE by hand`);
          }
        }
      }
    }

    // 3. Nothing uses 'year_ce' any more, so the ENUM can drop it.
    console.log("Removing 'year_ce' from data_source_column.data_type…");
    await conn.query(`ALTER TABLE data_source_column MODIFY COLUMN data_type ${FINAL_DDL}`);
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
