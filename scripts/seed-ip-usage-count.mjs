// Add a "Usage count" column to the Intellectual Property data source and
// backfill it on all existing entries with values correlated to ip_s_type.
//
//   npm run seed:ip-usage-count
//
// Idempotent in two independent places:
//   - the column is only inserted if col_key "usage_count" doesn't already exist
//     (and the script fails loudly if it exists with a different shape, rather
//     than silently overwriting a hand-edited column)
//   - each entry is only backfilled if its values_json doesn't already have a
//     "usage_count" key, so a rerun never clobbers a manually-set value
//
// Goes around the app's PUT /columns and PATCH /entries endpoints on purpose:
// PUT /columns replaces the WHOLE column set (submitting anything less than
// every existing column would delete the rest), and PATCH /entries replaces
// the WHOLE values_json rather than merging (a partial { usage_count } body
// would null out title/ip_s_type/owner/link/published_date and then reject
// the write, since those are required). JSON_SET touches only the one key.
import mysql from "mysql2/promise";

const SOURCE_NAME = "intellectual property";
const COL_KEY = "usage_count";
const COL_LABEL = "Usage count";

// Seed range per ip_s_type — patents/petty patents (long-lived, licensable)
// skew higher than copyrights/trademarks, mirroring how the original seed
// already varies expiry-date offsets by type.
const RANGES_BY_TYPE = {
  Patent: [20, 50],
  "Petty patent": [10, 30],
  Innovation: [5, 20],
  Invention: [5, 20],
  Copyright: [0, 10],
  Trademark: [0, 10],
};

function fail(message) {
  throw new Error(message);
}

/** Deterministic (not Math.random) so reruns produce the same value for the
 *  same row — same spirit as the hand-authored data in the original seed. */
function seededCount(entryId, type) {
  const range = RANGES_BY_TYPE[type];
  if (!range) fail(`No usage-count range configured for ip_s_type "${type}"`);
  const [min, max] = range;
  // Small multiplicative hash, folded into the range width.
  const hash = (entryId * 2654435761) >>> 0;
  return min + (hash % (max - min + 1));
}

async function loadSource(conn) {
  const [rows] = await conn.query(
    `SELECT id, period_grain AS periodGrain, status
       FROM data_source
      WHERE LOWER(TRIM(name)) = ?`,
    [SOURCE_NAME],
  );
  if (rows.length !== 1) {
    fail(`Expected exactly one "Intellectual Property" source, found ${rows.length}`);
  }
  const source = rows[0];
  if (source.status !== "active") fail("The Intellectual Property source is not active");
  if (source.periodGrain !== "quarterly") {
    fail("The Intellectual Property source must use quarterly entries");
  }
  return source;
}

/** Ensures the column exists with the expected shape. Returns true if it was
 *  just created, false if it already existed (and matched). */
async function ensureUsageCountColumn(conn, sourceId) {
  const [rows] = await conn.query(
    `SELECT data_type AS dataType, is_required AS isRequired
       FROM data_source_column
      WHERE data_source_id = ? AND col_key = ?`,
    [sourceId, COL_KEY],
  );

  if (rows.length > 0) {
    const col = rows[0];
    if (col.dataType !== "number" || !!col.isRequired !== false) {
      fail(
        `Column "${COL_KEY}" already exists but is not an optional number column ` +
          `(dataType=${col.dataType}, isRequired=${col.isRequired}); refusing to touch it`,
      );
    }
    console.log(`Column "${COL_LABEL}" already exists — skipping.`);
    return false;
  }

  const [sortRows] = await conn.query(
    "SELECT COALESCE(MAX(sort_order), -1) AS maxSort FROM data_source_column WHERE data_source_id = ?",
    [sourceId],
  );
  const nextSort = Number(sortRows[0].maxSort) + 1;

  await conn.execute(
    `INSERT INTO data_source_column
       (data_source_id, col_key, label, data_type, unit, options, is_required, sort_order)
     VALUES (?, ?, ?, 'number', NULL, NULL, 0, ?)`,
    [sourceId, COL_KEY, COL_LABEL, nextSort],
  );
  console.log(`Added column "${COL_LABEL}" (sort_order=${nextSort}).`);
  return true;
}

/** Backfills every entry missing the key. Returns the number of rows touched. */
async function backfillEntries(conn, sourceId) {
  const [rows] = await conn.query(
    `SELECT id, JSON_UNQUOTE(JSON_EXTRACT(values_json, '$.ip_s_type')) AS ipType
       FROM data_source_entry
      WHERE data_source_id = ?
        AND NOT JSON_CONTAINS_PATH(values_json, 'one', '$.usage_count')
      ORDER BY id`,
    [sourceId],
  );

  for (const row of rows) {
    const count = seededCount(row.id, row.ipType);
    await conn.execute(
      `UPDATE data_source_entry
          SET values_json = JSON_SET(values_json, '$.usage_count', ?)
        WHERE id = ?`,
      [count, row.id],
    );
  }
  return rows.length;
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
    const source = await loadSource(conn);

    await conn.beginTransaction();
    let backfilled;
    try {
      await ensureUsageCountColumn(conn, source.id);
      backfilled = await backfillEntries(conn, source.id);
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    }

    const [check] = await conn.query(
      `SELECT COUNT(*) AS n
         FROM data_source_entry
        WHERE data_source_id = ?
          AND JSON_CONTAINS_PATH(values_json, 'one', '$.usage_count')`,
      [source.id],
    );
    console.log(
      `Backfilled ${backfilled} row(s); ${check[0].n} of source ${source.id}'s entries now have a usage count.`,
    );
  } catch (error) {
    console.error("Usage-count backfill failed:", error.message ?? error);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
