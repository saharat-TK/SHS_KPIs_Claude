// Shared guardrails for database-backed raw-data demo seeds. Every seed is
// additive only into an empty source and becomes a no-op on an exact rerun.
import mysql from "mysql2/promise";

function fail(message) {
  throw new Error(message);
}

function parseJson(value) {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

function noteFor(prefix, index) {
  return `${prefix}${String(index + 1).padStart(2, "0")}`;
}

function validateRows({ displayName, rows, expectedCount, expectedColumns }) {
  if (rows.length !== expectedCount) {
    fail(`${displayName} needs exactly ${expectedCount} seed rows, found ${rows.length}`);
  }

  const expectedKeys = Object.keys(expectedColumns);
  const titles = new Set();
  for (const [index, row] of rows.entries()) {
    if (!Number.isInteger(row.year) || row.year < 2566 || row.year > 2568) {
      fail(`${displayName} seed row ${index + 1} has an invalid Buddhist year`);
    }
    if (![1, 2, 3, 4].includes(row.quarter)) {
      fail(`${displayName} seed row ${index + 1} has an invalid quarter`);
    }

    const actualKeys = Object.keys(row.values).sort();
    if (JSON.stringify(actualKeys) !== JSON.stringify([...expectedKeys].sort())) {
      fail(`${displayName} seed row ${index + 1} does not match the expected column keys`);
    }

    for (const [key, column] of Object.entries(expectedColumns)) {
      const value = row.values[key];
      if (column.isRequired && (value == null || value === "")) {
        fail(`${displayName} seed row ${index + 1} is missing required "${key}"`);
      }
      if (value == null) continue;

      if (column.dataType === "select" && !column.options.includes(value)) {
        fail(`${displayName} seed row ${index + 1} has an unsupported "${key}" value`);
      }
      if (column.dataType === "number" && !Number.isFinite(value)) {
        fail(`${displayName} seed row ${index + 1} has a non-numeric "${key}" value`);
      }
      if (column.dataType === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        fail(`${displayName} seed row ${index + 1} has an invalid "${key}" date`);
      }
      if (column.dataType === "faculty" && typeof value !== "string") {
        fail(`${displayName} seed row ${index + 1} has an invalid "${key}" faculty id`);
      }
    }

    const title = row.values.title ?? row.values.name_of_research_unit_group_center;
    if (title) {
      if (titles.has(title)) fail(`${displayName} has a duplicate seed title`);
      titles.add(title);
    }
  }
}

async function loadSource(conn, sourceName, displayName) {
  const [rows] = await conn.query(
    `SELECT id, period_grain AS periodGrain, status
       FROM data_source
      WHERE LOWER(TRIM(name)) = ?`,
    [sourceName.trim().toLowerCase()],
  );
  if (rows.length !== 1) {
    fail(`Expected exactly one ${displayName} source, found ${rows.length}`);
  }
  if (rows[0].status !== "active") fail(`${displayName} source is not active`);
  if (rows[0].periodGrain !== "quarterly") {
    fail(`${displayName} source must use quarterly entries`);
  }
  return rows[0];
}

async function validateColumns(conn, sourceId, displayName, expectedColumns) {
  const [columns] = await conn.query(
    `SELECT col_key AS colKey, data_type AS dataType,
            is_required AS isRequired, options
       FROM data_source_column
      WHERE data_source_id = ?
      ORDER BY sort_order, id`,
    [sourceId],
  );

  const expectedKeys = Object.keys(expectedColumns);
  const actualKeys = new Set(columns.map((column) => column.colKey));
  if (columns.length !== expectedKeys.length || actualKeys.size !== expectedKeys.length) {
    fail(`${displayName} source must have exactly these columns: ${expectedKeys.join(", ")}`);
  }

  for (const column of columns) {
    const expected = expectedColumns[column.colKey];
    if (!expected) fail(`${displayName} has an unexpected column "${column.colKey}"`);
    if (column.dataType !== expected.dataType || !!column.isRequired !== expected.isRequired) {
      fail(`${displayName} column "${column.colKey}" has an unexpected type or required setting`);
    }
    if (expected.options) {
      const options = parseJson(column.options);
      if (JSON.stringify(options) !== JSON.stringify(expected.options)) {
        fail(`${displayName} column "${column.colKey}" has unexpected options`);
      }
    }
  }
}

async function validateFacultyValues(conn, rows, expectedColumns, displayName) {
  const facultyKeys = Object.entries(expectedColumns)
    .filter(([, column]) => column.dataType === "faculty")
    .map(([key]) => key);
  const ids = [...new Set(rows.flatMap((row) => facultyKeys.map((key) => row.values[key])))]
    .filter(Boolean);
  if (ids.length === 0) return;

  const placeholders = ids.map(() => "?").join(", ");
  const [faculty] = await conn.query(
    `SELECT id FROM faculty WHERE status = 'active' AND id IN (${placeholders})`,
    ids,
  );
  const activeIds = new Set(faculty.map((member) => member.id));
  const missing = ids.filter((id) => !activeIds.has(id));
  if (missing.length > 0) {
    fail(`${displayName} seed refers to inactive or missing faculty: ${missing.join(", ")}`);
  }
}

async function assertSafeInsertState(conn, sourceId, rows, notePrefix, displayName) {
  const [existing] = await conn.query(
    "SELECT note FROM data_source_entry WHERE data_source_id = ? ORDER BY id",
    [sourceId],
  );
  if (existing.length === 0) return false;

  const expected = new Set(rows.map((_, index) => noteFor(notePrefix, index)));
  const actual = existing.map((entry) => entry.note);
  const isExactSeed =
    existing.length === rows.length &&
    new Set(actual).size === rows.length &&
    actual.every((note) => expected.has(note));
  if (isExactSeed) {
    console.log(`${displayName} already contains its ${rows.length} seed rows; nothing to do.`);
    return true;
  }

  fail(
    `${displayName} already has ${existing.length} entries that are not exactly the expected seed rows; refusing to modify it`,
  );
}

export async function seedDataSource({
  sourceName,
  displayName,
  expectedCount,
  expectedColumns,
  rows,
  notePrefix,
}) {
  validateRows({ displayName, rows, expectedCount, expectedColumns });

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const source = await loadSource(conn, sourceName, displayName);
    await validateColumns(conn, source.id, displayName, expectedColumns);
    await validateFacultyValues(conn, rows, expectedColumns, displayName);
    if (await assertSafeInsertState(conn, source.id, rows, notePrefix, displayName)) return;

    await conn.beginTransaction();
    try {
      for (const [index, row] of rows.entries()) {
        await conn.execute(
          `INSERT INTO data_source_entry
             (data_source_id, year, quarter, values_json, note, recorded_by)
           VALUES (?, ?, ?, ?, ?, NULL)`,
          [source.id, row.year, row.quarter, JSON.stringify(row.values), noteFor(notePrefix, index)],
        );
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    }

    const [countRows] = await conn.query(
      "SELECT COUNT(*) AS count FROM data_source_entry WHERE data_source_id = ?",
      [source.id],
    );
    if (Number(countRows[0].count) !== expectedCount) {
      fail(`${displayName} seed completed with an unexpected entry count: ${countRows[0].count}`);
    }
    console.log(`Seeded ${expectedCount} ${displayName} entries into source ${source.id}.`);
  } catch (error) {
    console.error(`${displayName} seed failed:`, error.message ?? error);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}
