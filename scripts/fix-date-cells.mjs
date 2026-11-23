// Check every Date / Year (BE) / Month cell against the rules in
// lib/kpi/cellFormats.ts, and convert Buddhist-era dates to CE.
//
//   node --env-file=.env.local scripts/fix-date-cells.mjs           # report only
//   node --env-file=.env.local scripts/fix-date-cells.mjs --apply   # convert BE dates
//
// Background. Date cells used to be checked only for the YYYY-MM-DD shape, and
// the seeded sources stored BE dates (2566-01-12). Dates are now CE, and a BE
// year is rejected on write, so those rows could no longer be edited. --apply
// rewrites each BE date (year >= 2400) to year - 543, checking the result with
// the app's parseStoredDate, in one transaction.
//
// Only dates are converted. A Year (BE) or Month cell that fails is reported for
// a person to fix: guessing a number's meaning is not safe.
//
// No KPI link filters on a date column today, so no KPI value moves; the report
// says so per link if that ever changes. Idempotent: a converted date is < 2400.
import mysql from "mysql2/promise";
import {
  BE_OFFSET,
  BE_YEAR_FROM,
  CellFormatError,
  parseStoredDate,
  parseMonth,
  parseYearBE,
} from "../lib/kpi/cellFormats.ts";

const apply = process.argv.includes("--apply");
// Stored dates are CE ISO, so they are checked with parseStoredDate (parseDate reads BE input).
const PARSERS = { date: parseStoredDate, year_be: parseYearBE, month: parseMonth };
const BE_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [columns] = await conn.query(
      `SELECT c.data_source_id AS ds, d.name, c.col_key AS colKey, c.label, c.data_type AS type
         FROM data_source_column c JOIN data_source d ON d.id = c.data_source_id
        WHERE c.data_type IN ('date','year_be','month')
        ORDER BY c.data_source_id, c.sort_order`,
    );

    const conversions = []; // { entryId, path, from, to }
    const problems = [];
    let checked = 0;

    for (const col of columns) {
      const path = `$.${col.colKey}`;
      const [rows] = await conn.query(
        `SELECT id, JSON_UNQUOTE(JSON_EXTRACT(values_json, ?)) AS v
           FROM data_source_entry WHERE data_source_id = ?`,
        [path, col.ds],
      );
      let converted = 0;
      for (const { id, v } of rows) {
        if (v === null || v === "null" || v === "") continue;
        checked += 1;
        const m = col.type === "date" ? BE_ISO.exec(v) : null;
        if (m && Number(m[1]) >= BE_YEAR_FROM) {
          const to = `${Number(m[1]) - BE_OFFSET}-${m[2]}-${m[3]}`;
          parseStoredDate(to); // throws if the CE date isn't real — never write a bad one
          conversions.push({ entryId: id, path, from: v, to });
          converted += 1;
          continue;
        }
        try {
          PARSERS[col.type](v);
        } catch (err) {
          if (!(err instanceof CellFormatError)) throw err;
          problems.push(`  #${id} ${col.name} › ${col.label}: "${v}" ${err.message}`);
        }
      }
      console.log(
        `${col.name} › ${col.label} (${col.type}): ${rows.length} rows` +
          (converted ? `, ${converted} BE dates to convert` : ""),
      );
    }

    // Any link filtering on a date column would compare against shifted values.
    const dateKeys = new Set(columns.filter((c) => c.type === "date").map((c) => `${c.ds}:${c.colKey}`));
    const [links] = await conn.query("SELECT id, data_source_id AS ds, mappings FROM data_source_link");
    for (const l of links) {
      const maps = typeof l.mappings === "string" ? JSON.parse(l.mappings) : (l.mappings ?? []);
      for (const mp of maps) {
        for (const f of [...(mp.filters ?? []), ...(mp.numeratorFilters ?? [])]) {
          if (dateKeys.has(`${l.ds}:${f.field}`)) {
            problems.push(`  link #${l.id} filters on date column "${f.field}" — update its bounds to CE by hand`);
          }
        }
      }
    }

    console.log(`\nChecked ${checked} cells. ${conversions.length} BE dates to convert to CE.`);
    for (const c of conversions.slice(0, 5)) console.log(`  e.g. #${c.entryId}: ${c.from} → ${c.to}`);
    console.log(problems.length ? `\n${problems.length} problem(s) to fix by hand:\n${problems.join("\n")}` : "No other problems.");

    if (!apply) {
      if (conversions.length) console.log("\nDry run — nothing written. Re-run with --apply to convert.");
      return;
    }
    if (conversions.length === 0) {
      console.log("\nNothing to convert.");
      return;
    }
    await conn.beginTransaction();
    try {
      for (const c of conversions) {
        await conn.query(
          "UPDATE data_source_entry SET values_json = JSON_SET(values_json, ?, ?) WHERE id = ?",
          [c.path, c.to, c.entryId],
        );
      }
      await conn.commit();
      console.log(`\nConverted ${conversions.length} dates to CE.`);
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
