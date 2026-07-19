// Seed 30 realistic demo rows into the Intellectual Property data source.
//
//   npm run seed:ip
//
// The seed is intentionally strict and non-destructive. It inserts only into
// an empty source, or becomes a no-op when its exact 30 marker notes already
// exist. Unexpected existing rows cause the command to stop without changing
// the database.
import mysql from "mysql2/promise";

const SOURCE_NAME = "intellectual property";
const SEED_NOTE_PREFIX = "Seed: Intellectual Property demo row ";

const EXPECTED_COLUMNS = {
  title: { dataType: "text", isRequired: true },
  ip_s_type: {
    dataType: "select",
    isRequired: true,
    options: [
      "Innovation",
      "Petty patent",
      "Patent",
      "Invention",
      "Copyright",
      "Trademark",
    ],
  },
  published_date: { dataType: "date", isRequired: true },
  end_date: { dataType: "date", isRequired: false },
  owner: { dataType: "faculty", isRequired: true },
  link: { dataType: "text", isRequired: true },
};

const ROWS = [
  { year: 2566, quarter: 1, title: "Portable UV-C Cabinet for Clinical Instruments", type: "Innovation", publishedDate: "2566-01-18", endDate: "2569-01-17", owner: "fac-001", link: "https://example.com/intellectual-property/ip-01" },
  { year: 2566, quarter: 1, title: "Low-Cost Respiratory Exercise Monitor", type: "Petty patent", publishedDate: "2566-02-06", endDate: "2576-02-05", owner: "fac-002", link: "https://example.com/intellectual-property/ip-02" },
  { year: 2566, quarter: 2, title: "Herbal Hand Sanitizer Formulation for Sensitive Skin", type: "Patent", publishedDate: "2566-04-22", endDate: "2586-04-21", owner: "fac-003", link: "https://example.com/intellectual-property/ip-03" },
  { year: 2566, quarter: 2, title: "Smart Pill Organizer with Adherence Alerts", type: "Invention", publishedDate: "2566-05-11", endDate: null, owner: "fac-004", link: "https://example.com/intellectual-property/ip-04" },
  { year: 2566, quarter: 3, title: "Nurse Handover Checklist and Audit Toolkit", type: "Copyright", publishedDate: "2566-07-15", endDate: null, owner: "fac-005", link: "https://example.com/intellectual-property/ip-05" },
  { year: 2566, quarter: 3, title: "Healthy Campus Communities", type: "Trademark", publishedDate: "2566-08-02", endDate: "2576-08-01", owner: "fac-006", link: "https://example.com/intellectual-property/ip-06" },
  { year: 2566, quarter: 4, title: "Solar-Powered Vaccine Transport Box", type: "Innovation", publishedDate: "2566-10-09", endDate: "2569-10-08", owner: "fac-007", link: "https://example.com/intellectual-property/ip-07" },
  { year: 2566, quarter: 4, title: "Adaptive Grip for Home Rehabilitation Tools", type: "Petty patent", publishedDate: "2566-11-18", endDate: "2576-11-17", owner: "fac-008", link: "https://example.com/intellectual-property/ip-08" },
  { year: 2566, quarter: 4, title: "Rapid Colorimetric Water Quality Test Strip", type: "Patent", publishedDate: "2566-12-04", endDate: "2586-12-03", owner: "fac-009", link: "https://example.com/intellectual-property/ip-09" },
  { year: 2566, quarter: 1, title: "Community Nutrition Screening Workbook", type: "Copyright", publishedDate: "2566-01-29", endDate: null, owner: "fac-010", link: "https://example.com/intellectual-property/ip-10" },
  { year: 2567, quarter: 1, title: "Digital Triage Dashboard for Primary Care Clinics", type: "Innovation", publishedDate: "2567-01-12", endDate: null, owner: "fac-011", link: "https://example.com/intellectual-property/ip-11" },
  { year: 2567, quarter: 1, title: "Ergonomic Transfer Board for Older Adults", type: "Petty patent", publishedDate: "2567-02-21", endDate: "2577-02-20", owner: "fac-012", link: "https://example.com/intellectual-property/ip-12" },
  { year: 2567, quarter: 2, title: "Plant-Based Antimicrobial Wound Dressing", type: "Patent", publishedDate: "2567-04-17", endDate: "2587-04-16", owner: "fac-013", link: "https://example.com/intellectual-property/ip-13" },
  { year: 2567, quarter: 2, title: "Interactive Anatomy Learning Model", type: "Invention", publishedDate: "2567-05-08", endDate: null, owner: "fac-014", link: "https://example.com/intellectual-property/ip-14" },
  { year: 2567, quarter: 2, title: "Medication Reconciliation Training Cards", type: "Copyright", publishedDate: "2567-06-03", endDate: null, owner: "fac-015", link: "https://example.com/intellectual-property/ip-15" },
  { year: 2567, quarter: 3, title: "Move More MFU", type: "Trademark", publishedDate: "2567-07-19", endDate: "2577-07-18", owner: "fac-016", link: "https://example.com/intellectual-property/ip-16" },
  { year: 2567, quarter: 3, title: "Portable Neonatal Temperature Sensor", type: "Innovation", publishedDate: "2567-08-14", endDate: "2570-08-13", owner: "fac-017", link: "https://example.com/intellectual-property/ip-17" },
  { year: 2567, quarter: 3, title: "Adjustable Wheelchair Foot Support", type: "Petty patent", publishedDate: "2567-09-07", endDate: "2577-09-06", owner: "fac-018", link: "https://example.com/intellectual-property/ip-18" },
  { year: 2567, quarter: 4, title: "Machine Learning Model for Fall Risk Screening", type: "Patent", publishedDate: "2567-10-26", endDate: "2587-10-25", owner: "fac-019", link: "https://example.com/intellectual-property/ip-19" },
  { year: 2567, quarter: 4, title: "Telehealth Consent and Privacy Guide", type: "Copyright", publishedDate: "2567-11-15", endDate: null, owner: "fac-020", link: "https://example.com/intellectual-property/ip-20" },
  { year: 2568, quarter: 1, title: "Airflow-Safe Classroom Design Toolkit", type: "Innovation", publishedDate: "2568-01-10", endDate: null, owner: "fac-021", link: "https://example.com/intellectual-property/ip-21" },
  { year: 2568, quarter: 1, title: "Hands-Free Soap Dispenser Mount", type: "Petty patent", publishedDate: "2568-02-02", endDate: "2578-02-01", owner: "fac-022", link: "https://example.com/intellectual-property/ip-22" },
  { year: 2568, quarter: 2, title: "Bioactive Film for Fresh-Cut Produce", type: "Patent", publishedDate: "2568-04-18", endDate: "2588-04-17", owner: "fac-023", link: "https://example.com/intellectual-property/ip-23" },
  { year: 2568, quarter: 2, title: "Wearable Hydration Reminder for Field Workers", type: "Invention", publishedDate: "2568-05-13", endDate: null, owner: "fac-024", link: "https://example.com/intellectual-property/ip-24" },
  { year: 2568, quarter: 2, title: "Research Ethics Casebook for Health Sciences", type: "Copyright", publishedDate: "2568-06-06", endDate: null, owner: "fac-025", link: "https://example.com/intellectual-property/ip-25" },
  { year: 2568, quarter: 3, title: "Health Sciences Innovation Hub", type: "Trademark", publishedDate: "2568-07-03", endDate: "2578-07-02", owner: "fac-026", link: "https://example.com/intellectual-property/ip-26" },
  { year: 2568, quarter: 3, title: "Low-Noise Mobility Aid for Hospital Corridors", type: "Innovation", publishedDate: "2568-08-22", endDate: "2571-08-21", owner: "fac-027", link: "https://example.com/intellectual-property/ip-27" },
  { year: 2568, quarter: 3, title: "Modular Splint for Pediatric Rehabilitation", type: "Petty patent", publishedDate: "2568-09-16", endDate: "2578-09-15", owner: "fac-028", link: "https://example.com/intellectual-property/ip-28" },
  { year: 2568, quarter: 4, title: "Point-of-Care Dengue Screening Cartridge", type: "Patent", publishedDate: "2568-10-28", endDate: "2588-10-27", owner: "fac-029", link: "https://example.com/intellectual-property/ip-29" },
  { year: 2568, quarter: 4, title: "Community Health Data Storytelling Guide", type: "Copyright", publishedDate: "2568-11-19", endDate: null, owner: "fac-030", link: "https://example.com/intellectual-property/ip-30" },
];

function parseJson(value) {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

function fail(message) {
  throw new Error(message);
}

function validateSeedRows() {
  if (ROWS.length !== 30) fail(`Expected 30 seed rows, found ${ROWS.length}`);

  const titles = new Set();
  const notes = new Set();
  for (const [index, row] of ROWS.entries()) {
    if (titles.has(row.title)) fail(`Duplicate seed title at row ${index + 1}`);
    titles.add(row.title);

    if (!Number.isInteger(row.year) || row.year < 2566 || row.year > 2568) {
      fail(`Seed row ${index + 1} has an invalid Buddhist year`);
    }
    if (![1, 2, 3, 4].includes(row.quarter)) {
      fail(`Seed row ${index + 1} has an invalid quarter`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.publishedDate)) {
      fail(`Seed row ${index + 1} has an invalid published date`);
    }
    if (row.endDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(row.endDate)) {
      fail(`Seed row ${index + 1} has an invalid end date`);
    }
    if (row.endDate !== null && row.endDate <= row.publishedDate) {
      fail(`Seed row ${index + 1} ends before it is published`);
    }

    const note = `${SEED_NOTE_PREFIX}${String(index + 1).padStart(2, "0")}`;
    if (notes.has(note)) fail(`Duplicate seed note at row ${index + 1}`);
    notes.add(note);
  }
}

async function loadSource(conn) {
  const [rows] = await conn.query(
    `SELECT id, name, period_grain AS periodGrain, status
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

async function validateSourceColumns(conn, sourceId) {
  const [columns] = await conn.query(
    `SELECT col_key AS colKey, data_type AS dataType,
            is_required AS isRequired, options
       FROM data_source_column
      WHERE data_source_id = ?
      ORDER BY sort_order, id`,
    [sourceId],
  );

  const actualKeys = new Set(columns.map((column) => column.colKey));
  const expectedKeys = Object.keys(EXPECTED_COLUMNS);
  if (columns.length !== expectedKeys.length || actualKeys.size !== expectedKeys.length) {
    fail(`The Intellectual Property source must have exactly these columns: ${expectedKeys.join(", ")}`);
  }

  for (const column of columns) {
    const expected = EXPECTED_COLUMNS[column.colKey];
    if (!expected) fail(`Unexpected Intellectual Property column "${column.colKey}"`);
    if (column.dataType !== expected.dataType || !!column.isRequired !== expected.isRequired) {
      fail(`Column "${column.colKey}" does not match the expected type/required setting`);
    }

    if (expected.options) {
      const options = parseJson(column.options);
      if (JSON.stringify(options) !== JSON.stringify(expected.options)) {
        fail(`Column "${column.colKey}" does not have the expected IP type options`);
      }
    }
  }

  const allowedTypes = new Set(EXPECTED_COLUMNS.ip_s_type.options);
  for (const row of ROWS) {
    if (!allowedTypes.has(row.type)) fail(`Unsupported IP type in seed row: ${row.type}`);
  }
}

async function validateOwners(conn) {
  const ownerIds = [...new Set(ROWS.map((row) => row.owner))];
  const placeholders = ownerIds.map(() => "?").join(", ");
  const [owners] = await conn.query(
    `SELECT id
       FROM faculty
      WHERE status = 'active' AND id IN (${placeholders})`,
    ownerIds,
  );
  const activeIds = new Set(owners.map((owner) => owner.id));
  const missing = ownerIds.filter((id) => !activeIds.has(id));
  if (missing.length > 0) fail(`Seed owners are not active faculty: ${missing.join(", ")}`);
}

function expectedNotes() {
  return ROWS.map((_, index) => `${SEED_NOTE_PREFIX}${String(index + 1).padStart(2, "0")}`);
}

async function assertSafeInsertState(conn, sourceId) {
  const [existing] = await conn.query(
    `SELECT id, note
       FROM data_source_entry
      WHERE data_source_id = ?
      ORDER BY id`,
    [sourceId],
  );

  if (existing.length === 0) return;

  const expected = new Set(expectedNotes());
  const actual = existing.map((entry) => entry.note);
  const isExactSeed =
    existing.length === ROWS.length &&
    new Set(actual).size === ROWS.length &&
    actual.every((note) => expected.has(note));

  if (isExactSeed) {
    console.log("The Intellectual Property source already contains the 30 seed rows; nothing to do.");
    return true;
  }

  fail(
    `The Intellectual Property source already has ${existing.length} entries that are not exactly the expected 30 seed rows; refusing to modify it`,
  );
}

async function main() {
  validateSeedRows();

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const source = await loadSource(conn);
    await validateSourceColumns(conn, source.id);
    await validateOwners(conn);

    if (await assertSafeInsertState(conn, source.id)) return;

    await conn.beginTransaction();
    try {
      for (const [index, row] of ROWS.entries()) {
        await conn.execute(
          `INSERT INTO data_source_entry
             (data_source_id, year, quarter, values_json, note, recorded_by)
           VALUES (?, ?, ?, ?, ?, NULL)`,
          [
            source.id,
            row.year,
            row.quarter,
            JSON.stringify({
              title: row.title,
              ip_s_type: row.type,
              published_date: row.publishedDate,
              end_date: row.endDate,
              owner: row.owner,
              link: row.link,
            }),
            `${SEED_NOTE_PREFIX}${String(index + 1).padStart(2, "0")}`,
          ],
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
    if (Number(countRows[0].count) !== ROWS.length) {
      fail(`Seed completed with an unexpected entry count: ${countRows[0].count}`);
    }
    console.log(`Seeded ${ROWS.length} Intellectual Property entries into source ${source.id}.`);
  } catch (error) {
    console.error("Intellectual Property seed failed:", error.message ?? error);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
