// Export the "Research publications" data source to a snapshot file that
// scripts/migrate-research-publications.mjs can apply to another database.
//
//   npm run export:research-publications
//   npm run export:research-publications -- --out some/other.json
//
// It imports lib/kpi/sourceSnapshot.ts, so it runs under tsx (a devDependency):
// Node 20 can't load .ts on its own.
//
// Read-only. Writes scripts/data/research-publications.snapshot.json holding
//   * the source (owner committee, grain, description),
//   * its columns exactly as defined now (types, required, options, "ref by",
//     multiple, auto-fill, order),
//   * its KPI/metric links, named rather than numbered (database ids differ
//     between environments),
//   * every entry, with its note, incomplete flag, recorder and timestamps.
// A value left behind by a column that no longer exists (author_position) is
// dropped from each entry, since the entry validator rejects unknown keys.
//
// Re-running overwrites the snapshot, so it always reflects this database.
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { keepColumnValues } from "../lib/kpi/sourceSnapshot.ts";

const SOURCE_NAME = "Research publications";
const DEFAULT_OUT = "scripts/data/research-publications.snapshot.json";

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const OUT = outIndex >= 0 ? args[outIndex + 1] : DEFAULT_OUT;

/** mysql2 gives JSON columns as objects on MySQL but as strings on MariaDB. */
function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  return typeof value === "string" ? JSON.parse(value) : value;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Keep timestamps as the database's own text so they round-trip unchanged.
    dateStrings: true,
  });
  try {
    const [sources] = await conn.query(
      `SELECT id, name, description, committee_id AS committeeId,
              period_grain AS periodGrain, status
         FROM data_source WHERE LOWER(TRIM(name)) = ?`,
      [SOURCE_NAME.toLowerCase()],
    );
    if (sources.length !== 1) {
      throw new Error(`Expected exactly one "${SOURCE_NAME}" source, found ${sources.length}`);
    }
    const source = sources[0];

    const [columnRows] = await conn.query(
      `SELECT col_key AS colKey, label, data_type AS dataType, unit, options,
              ref_col_key AS refColKey, is_multiple AS isMultiple,
              auto_fill AS autoFill, is_required AS isRequired, sort_order AS sortOrder
         FROM data_source_column WHERE data_source_id = ? ORDER BY sort_order, id`,
      [source.id],
    );
    const columns = columnRows.map((c) => ({
      colKey: c.colKey,
      label: c.label,
      dataType: c.dataType,
      unit: c.unit ?? null,
      options: parseJson(c.options),
      refColKey: c.refColKey ?? null,
      isMultiple: !!c.isMultiple,
      autoFill: c.autoFill ?? null,
      isRequired: !!c.isRequired,
      sortOrder: Number(c.sortOrder),
    }));

    const [linkRows] = await conn.query(
      `SELECT l.mappings, l.note, s.name AS setName, k.name AS kpiName,
              m.name AS metricName, l.library_metric_id AS libraryMetricId
         FROM data_source_link l
         LEFT JOIN library_metric m ON m.id = l.library_metric_id
         LEFT JOIN library_kpi    k ON k.id = COALESCE(l.library_kpi_id, m.kpi_id)
         LEFT JOIN strategic_set  s ON s.id = k.set_id
        WHERE l.data_source_id = ? ORDER BY l.id`,
      [source.id],
    );
    const links = linkRows.map((l) => {
      if (!l.kpiName || !l.setName) {
        throw new Error("A link points at a KPI that no longer exists; fix or remove it first");
      }
      return {
        target: {
          setName: l.setName,
          kpiName: l.kpiName,
          metricName: l.libraryMetricId == null ? null : l.metricName,
        },
        mappings: parseJson(l.mappings, []),
        note: l.note ?? null,
      };
    });

    const [entryRows] = await conn.query(
      `SELECT year, quarter, values_json AS valuesJson, note,
              is_incomplete AS isIncomplete, recorded_by AS recordedBy,
              created_at AS createdAt, updated_at AS updatedAt
         FROM data_source_entry WHERE data_source_id = ? ORDER BY id`,
      [source.id],
    );
    const entries = entryRows.map((e) => ({
      year: Number(e.year),
      quarter: e.quarter == null ? null : Number(e.quarter),
      values: keepColumnValues(parseJson(e.valuesJson, {}), columns),
      note: e.note ?? null,
      isIncomplete: !!e.isIncomplete,
      recordedBy: e.recordedBy ?? null,
      createdAt: e.createdAt ?? null,
      updatedAt: e.updatedAt ?? null,
    }));

    const snapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: {
        name: source.name,
        description: source.description ?? null,
        committeeId: source.committeeId,
        periodGrain: source.periodGrain,
        status: source.status,
      },
      columns,
      links,
      entries,
    };

    // One entry per line keeps a re-export reviewable in a diff.
    const { entries: _entries, ...rest } = snapshot;
    const head = JSON.stringify(rest, null, 2).replace(/\n}$/, "");
    const body = entries.map((e) => `    ${JSON.stringify(e)}`).join(",\n");
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, `${head},\n  "entries": [\n${body}\n  ]\n}\n`);

    const incomplete = entries.filter((e) => e.isIncomplete).length;
    console.log(
      `Exported "${source.name}" (id ${source.id}) to ${OUT}: ` +
        `${columns.length} columns, ${links.length} links, ${entries.length} entries` +
        `${incomplete ? ` (${incomplete} flagged incomplete)` : ""}.`,
    );
  } catch (error) {
    console.error("Export failed:", error.message ?? error);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
