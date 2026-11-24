// Migrate the "Research publications" data source into the database in
// .env.local: the source, its columns, its KPI links and its entries.
//
//   npm run migrate:research-publications -- --dry-run
//   npm run migrate:research-publications
//
// It imports lib/kpi/sourceSnapshot.ts, so it runs under tsx (a devDependency):
// Node 20 can't load .ts on its own.
//
// Reads scripts/data/research-publications.snapshot.json, written by
// scripts/export-research-publications.mjs from the database where the source
// was built (--snapshot <file> picks another).
//
// Add-only and idempotent — run it as often as you like:
//   * source   created if no source has that name (case-insensitive), else reused;
//   * columns  missing ones inserted, ones that differ updated to the snapshot,
//              extra ones reported and left alone;
//   * entries  compared with what is already there by period + column values (as
//              a multiset, so identical rows are counted, not collapsed); only
//              the missing ones are inserted, keeping note, incomplete flag,
//              recorder and timestamps;
//   * links    the KPI/metric is found by set + KPI + metric NAME (ids differ per
//              database); a link is created when that target has none, and one
//              that already exists with different mappings is reported, not
//              overwritten.
// Everything runs in one transaction. --dry-run does all of it and rolls back, so
// it is a read-only preview.
//
// It does not recompute KPI values (the feed is TypeScript the plain-node
// scripts can't load). Afterwards, press "Recompute from Data Sources" on the
// performance record(s) these KPIs belong to.
import fs from "node:fs";
import mysql from "mysql2/promise";
import {
  columnDiff,
  keepColumnValues,
  linkAction,
  planEntries,
  resolveLinkTarget,
} from "../lib/kpi/sourceSnapshot.ts";

const DEFAULT_SNAPSHOT = "scripts/data/research-publications.snapshot.json";
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const snapIndex = args.indexOf("--snapshot");
const SNAPSHOT_PATH = snapIndex >= 0 ? args[snapIndex + 1] : DEFAULT_SNAPSHOT;

/** Features the snapshot relies on, with the migration that adds each one. */
const NEEDS = [
  ["data_source_column", "ref_col_key", "migrate:data-source-column-links"],
  ["data_source_column", "is_multiple", "migrate:data-source-column-links"],
  ["data_source_column", "auto_fill", "migrate:data-source-column-links"],
  ["data_source_entry", "is_incomplete", "migrate:data-source-entry-incomplete"],
];
const NEEDED_TYPES = [
  ["year_be", "migrate:data-source-year-be"],
  ["month", "migrate:data-source-date-types"],
  ["date", "migrate:data-source-date-types"],
];

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  return typeof value === "string" ? JSON.parse(value) : value;
}

async function preflight(conn, snapshot) {
  const problems = [];

  for (const [table, column, fix] of NEEDS) {
    const [rows] = await conn.query(
      `SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
      [table, column],
    );
    if (rows.length === 0) problems.push(`${table}.${column} is missing — run: npm run ${fix}`);
  }

  const [typeRows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'data_source_column'
        AND column_name = 'data_type'`,
  );
  const typeText = typeRows[0]?.t ?? "";
  for (const [type, fix] of NEEDED_TYPES) {
    if (!typeText.includes(`'${type}'`)) {
      problems.push(`data_source_column.data_type does not allow '${type}' — run: npm run ${fix}`);
    }
  }

  const [committee] = await conn.query("SELECT 1 FROM committees WHERE id = ?", [
    snapshot.source.committeeId,
  ]);
  if (committee.length === 0) {
    problems.push(`committee "${snapshot.source.committeeId}" does not exist in this database`);
  }

  // Faculty cells hold a faculty id with no foreign key, so check them here.
  const facultyKeys = snapshot.columns.filter((c) => c.dataType === "faculty").map((c) => c.colKey);
  const ids = [
    ...new Set(
      snapshot.entries.flatMap((e) => facultyKeys.map((k) => e.values[k]).filter(Boolean)),
    ),
  ];
  const known = await existingFacultyIds(conn, ids);
  const missing = ids.filter((id) => !known.has(id));
  if (missing.length > 0) {
    problems.push(
      `${missing.length} faculty id(s) used by the entries do not exist here: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? ", …" : ""}`,
    );
  }
  return problems;
}

async function existingFacultyIds(conn, ids) {
  if (ids.length === 0) return new Set();
  const [rows] = await conn.query("SELECT id FROM faculty WHERE id IN (?)", [ids]);
  return new Set(rows.map((r) => r.id));
}

async function ensureSource(conn, snapshot, report) {
  const { source } = snapshot;
  const [rows] = await conn.query(
    "SELECT id FROM data_source WHERE LOWER(TRIM(name)) = ?",
    [source.name.trim().toLowerCase()],
  );
  if (rows.length > 1) throw new Error(`Found ${rows.length} sources named "${source.name}"`);
  if (rows.length === 1) {
    report.source = `exists (id ${rows[0].id})`;
    return rows[0].id;
  }
  const [result] = await conn.query(
    `INSERT INTO data_source (name, description, committee_id, period_grain, status, created_by)
     VALUES (?, ?, ?, ?, ?, NULL)`,
    [source.name, source.description, source.committeeId, source.periodGrain, source.status],
  );
  report.source = `created (id ${result.insertId})`;
  return result.insertId;
}

async function syncColumns(conn, sourceId, snapshot, report) {
  const [rows] = await conn.query(
    `SELECT col_key AS colKey, label, data_type AS dataType, unit, options,
            ref_col_key AS refColKey, is_multiple AS isMultiple, auto_fill AS autoFill,
            is_required AS isRequired, sort_order AS sortOrder
       FROM data_source_column WHERE data_source_id = ? ORDER BY sort_order, id`,
    [sourceId],
  );
  const existing = rows.map((c) => ({
    ...c,
    unit: c.unit ?? null,
    options: parseJson(c.options),
    refColKey: c.refColKey ?? null,
    autoFill: c.autoFill ?? null,
    isMultiple: !!c.isMultiple,
    isRequired: !!c.isRequired,
    sortOrder: Number(c.sortOrder),
  }));
  const diff = columnDiff(existing, snapshot.columns);

  const values = (c) => [
    c.label,
    c.dataType,
    c.unit,
    c.options == null ? null : JSON.stringify(c.options),
    c.refColKey,
    c.isMultiple ? 1 : 0,
    c.autoFill,
    c.isRequired ? 1 : 0,
    c.sortOrder,
  ];
  for (const c of diff.missing) {
    await conn.query(
      `INSERT INTO data_source_column
         (data_source_id, col_key, label, data_type, unit, options, ref_col_key,
          is_multiple, auto_fill, is_required, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sourceId, c.colKey, ...values(c)],
    );
  }
  for (const { wanted } of diff.changed) {
    await conn.query(
      `UPDATE data_source_column
          SET label = ?, data_type = ?, unit = ?, options = ?, ref_col_key = ?,
              is_multiple = ?, auto_fill = ?, is_required = ?, sort_order = ?
        WHERE data_source_id = ? AND col_key = ?`,
      [...values(wanted), sourceId, wanted.colKey],
    );
  }
  report.columns = {
    inserted: diff.missing.length,
    updated: diff.changed.map((c) => `${c.wanted.colKey} (${c.fields.join(", ")})`),
    unchanged: snapshot.columns.length - diff.missing.length - diff.changed.length,
    extra: diff.extra.map((c) => c.colKey),
  };
}

async function syncEntries(conn, sourceId, snapshot, report) {
  const [rows] = await conn.query(
    "SELECT year, quarter, values_json AS valuesJson FROM data_source_entry WHERE data_source_id = ?",
    [sourceId],
  );
  const existing = rows.map((r) => ({
    year: Number(r.year),
    quarter: r.quarter == null ? null : Number(r.quarter),
    values: parseJson(r.valuesJson, {}),
  }));
  const { toInsert, present } = planEntries(snapshot.columns, existing, snapshot.entries);

  // A recorder who isn't in this database becomes "unknown" rather than failing.
  const recorders = [...new Set(toInsert.map((e) => e.recordedBy).filter(Boolean))];
  const knownRecorders = await existingFacultyIds(conn, recorders);

  const CHUNK = 200;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const batch = toInsert.slice(i, i + CHUNK).map((e) => [
      sourceId,
      e.year,
      e.quarter,
      JSON.stringify(keepColumnValues(e.values, snapshot.columns)),
      e.note,
      e.isIncomplete ? 1 : 0,
      e.recordedBy && knownRecorders.has(e.recordedBy) ? e.recordedBy : null,
      e.createdAt ?? new Date().toISOString().slice(0, 19).replace("T", " "),
      e.updatedAt ?? e.createdAt ?? new Date().toISOString().slice(0, 19).replace("T", " "),
    ]);
    await conn.query(
      `INSERT INTO data_source_entry
         (data_source_id, year, quarter, values_json, note, is_incomplete,
          recorded_by, created_at, updated_at)
       VALUES ?`,
      [batch],
    );
  }
  report.entries = { inserted: toInsert.length, alreadyPresent: present };
}

async function syncLinks(conn, sourceId, snapshot, report) {
  const [kpis] = await conn.query(
    `SELECT k.id, k.name, s.name AS setName
       FROM library_kpi k JOIN strategic_set s ON s.id = k.set_id`,
  );
  const [metrics] = await conn.query("SELECT id, kpi_id AS kpiId, name FROM library_metric");
  const library = { kpis, metrics };

  const result = { created: 0, present: 0, differs: [], skipped: [] };
  for (const link of snapshot.links) {
    const label = link.target.metricName
      ? `${link.target.kpiName} → ${link.target.metricName}`
      : link.target.kpiName;
    const target = resolveLinkTarget(link.target, library);
    if (!target.ok) {
      result.skipped.push(`${label}: ${target.reason}`);
      continue;
    }
    const [found] = await conn.query(
      `SELECT mappings FROM data_source_link
        WHERE data_source_id = ? AND library_kpi_id <=> ? AND library_metric_id <=> ?`,
      [sourceId, target.libraryKpiId, target.libraryMetricId],
    );
    const action = linkAction(
      found.length ? parseJson(found[0].mappings, []) : null,
      link.mappings,
    );
    if (action === "present") result.present += 1;
    else if (action === "differs") result.differs.push(label);
    else {
      await conn.query(
        `INSERT INTO data_source_link
           (data_source_id, library_kpi_id, library_metric_id, mappings, note)
         VALUES (?, ?, ?, ?, ?)`,
        [sourceId, target.libraryKpiId, target.libraryMetricId, JSON.stringify(link.mappings), link.note],
      );
      result.created += 1;
    }
  }
  report.links = result;
}

function print(report, snapshot) {
  const { columns: c, entries: e, links: l } = report;
  console.log(`\nSource:   ${report.source}`);
  console.log(
    `Columns:  ${c.inserted} inserted, ${c.updated.length} updated, ${c.unchanged} unchanged` +
      `${c.updated.length ? `\n          updated: ${c.updated.join("; ")}` : ""}` +
      `${c.extra.length ? `\n          left alone (not in snapshot): ${c.extra.join(", ")}` : ""}`,
  );
  console.log(`Entries:  ${e.inserted} inserted, ${e.alreadyPresent} already present (of ${snapshot.entries.length})`);
  console.log(
    `Links:    ${l.created} created, ${l.present} already present` +
      `${l.differs.length ? `\n          differ, left as they are: ${l.differs.join("; ")}` : ""}` +
      `${l.skipped.length ? `\n          skipped:\n            - ${l.skipped.join("\n            - ")}` : ""}`,
  );
  const changed = e.inserted + c.inserted + c.updated.length + l.created > 0 || report.source.startsWith("created");
  console.log(
    changed
      ? `\n${DRY ? "Dry run — nothing was written." : "Done."} Afterwards press "Recompute from Data Sources" on the performance record(s) these KPIs belong to.`
      : "\nNothing to do — this database already matches the snapshot.",
  );
}

async function main() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
  if (snapshot.version !== 1) throw new Error(`Unsupported snapshot version ${snapshot.version}`);
  console.log(
    `Snapshot: ${SNAPSHOT_PATH} — "${snapshot.source.name}", ${snapshot.columns.length} columns, ` +
      `${snapshot.links.length} links, ${snapshot.entries.length} entries (exported ${snapshot.exportedAt}).`,
  );

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
    console.log(`Target:   database "${db}"${DRY ? " (dry run: nothing will be written)" : ""}`);
    const problems = await preflight(conn, snapshot);
    if (problems.length > 0) {
      console.error("\nCannot migrate yet:\n  - " + problems.join("\n  - "));
      process.exitCode = 1;
      return;
    }

    await conn.beginTransaction();
    try {
      const report = {};
      const sourceId = await ensureSource(conn, snapshot, report);
      await syncColumns(conn, sourceId, snapshot, report);
      await syncEntries(conn, sourceId, snapshot, report);
      await syncLinks(conn, sourceId, snapshot, report);
      if (DRY) await conn.rollback();
      else await conn.commit();
      print(report, snapshot);
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Migration failed:", error.message ?? error);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
