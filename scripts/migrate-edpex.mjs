// One-off migration: EdPEx topic / area reference lists, and the two KPI columns
// that point at them.
//
//   node --env-file=.env.local scripts/migrate-edpex.mjs
//
// Idempotent. Steps:
//   1. Create `edpex_topic` and `edpex_area` (global — not scoped to a strategic
//      set, so cloning a set copies the ids as-is with no remap).
//   2. Seed the EdPEx Category 7 results items (7.1–7.5) and their ก/ข/ค areas,
//      named as in the School's SAR. Admins edit them afterwards at /admin/edpex.
//   3. library_kpi / perf_kpi: add `edpex_topic_id` + `edpex_area_id`,
//      + FKs/indexes on library_kpi only.
//
// Both KPI columns are optional; existing KPIs stay blank. perf_* tables take no
// FKs: a snapshot must survive its source topic/area being deleted (schema
// decision #4).
import mysql from "mysql2/promise";

const TOPICS = [
  { id: "7.1", name: "ผลลัพธ์ด้านการเรียนรู้ของผู้เรียนและด้านกระบวนการ" },
  { id: "7.2", name: "ผลลัพธ์ด้านลูกค้า" },
  { id: "7.3", name: "ผลลัพธ์ด้านบุคลากร" },
  { id: "7.4", name: "ผลลัพธ์ด้านการนำองค์กรและการกำกับดูแลองค์กร" },
  { id: "7.5", name: "ผลลัพธ์ด้านงบประมาณ การเงิน ตลาด และกลยุทธ์" },
];

const AREAS = [
  { topicId: "7.1", code: "ก", name: "ผลลัพธ์ด้านการเรียนรู้ของผู้เรียนและด้านบริการที่มุ่งเน้นลูกค้า" },
  { topicId: "7.1", code: "ข", name: "ผลลัพธ์ด้านประสิทธิผลของกระบวนการทำงาน" },
  { topicId: "7.1", code: "ค", name: "ผลลัพธ์ด้านการจัดการเครือข่ายอุปทาน" },
  { topicId: "7.2", code: "ก", name: "ผลลัพธ์ด้านการมุ่งเน้นผู้เรียนและลูกค้ากลุ่มอื่น" },
  { topicId: "7.3", code: "ก", name: "ผลลัพธ์ด้านการมุ่งเน้นบุคลากร" },
  {
    topicId: "7.4",
    code: "ก",
    name: "ผลลัพธ์ด้านการนำองค์กร การกำกับดูแลองค์กร กฎหมาย จริยธรรม และการสร้างประโยชน์ให้สังคม",
  },
  { topicId: "7.5", code: "ก", name: "ผลลัพธ์ด้านงบประมาณ การเงิน และตลาด" },
  { topicId: "7.5", code: "ข", name: "ผลลัพธ์ด้านการนำกลยุทธ์ไปปฏิบัติและด้านนวัตกรรม" },
];

async function columnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows[0]?.t ?? null;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?`,
    [table],
  );
  return rows.length > 0;
}

async function fkExists(conn, name) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = DATABASE() AND constraint_name = ? AND constraint_type = 'FOREIGN KEY'`,
    [name],
  );
  return rows.length > 0;
}

async function indexExists(conn, table, name) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, name],
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

    // ── 1. Reference tables ────────────────────────────────────────────────
    // DDL auto-commits in MySQL, so every step is guarded independently.
    if (!(await tableExists(conn, "edpex_topic"))) {
      console.log("Creating edpex_topic…");
      await conn.query(`
        CREATE TABLE edpex_topic (
          id          VARCHAR(10)  PRIMARY KEY,
          name        VARCHAR(500) NOT NULL,
          sort_order  INT          NOT NULL DEFAULT 0,
          created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }
    if (!(await tableExists(conn, "edpex_area"))) {
      console.log("Creating edpex_area…");
      await conn.query(`
        CREATE TABLE edpex_area (
          id          VARCHAR(20)  PRIMARY KEY,
          topic_id    VARCHAR(10)  NOT NULL,
          code        VARCHAR(10)  NOT NULL,
          name        VARCHAR(500) NOT NULL,
          sort_order  INT          NOT NULL DEFAULT 0,
          created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_edpex_area_code (topic_id, code),
          CONSTRAINT fk_edpex_area_topic FOREIGN KEY (topic_id)
            REFERENCES edpex_topic(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    // ── 2. Seed ────────────────────────────────────────────────────────────
    let topics = 0;
    for (const [i, t] of TOPICS.entries()) {
      const [res] = await conn.query(
        "INSERT IGNORE INTO edpex_topic (id, name, sort_order) VALUES (?, ?, ?)",
        [t.id, t.name, i + 1],
      );
      topics += res.affectedRows;
    }
    let areas = 0;
    for (const [i, a] of AREAS.entries()) {
      const [res] = await conn.query(
        `INSERT IGNORE INTO edpex_area (id, topic_id, code, name, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [`${a.topicId}${a.code}`, a.topicId, a.code, a.name, i + 1],
      );
      areas += res.affectedRows;
    }
    console.log(
      `EdPEx seed: ${topics} topic(s) and ${areas} area(s) inserted ` +
        `(${TOPICS.length - topics} / ${AREAS.length - areas} already present).`,
    );

    // ── 3. KPI columns ─────────────────────────────────────────────────────
    for (const table of ["library_kpi", "perf_kpi"]) {
      if ((await columnType(conn, table, "edpex_topic_id")) == null) {
        console.log(`Adding ${table}.edpex_topic_id…`);
        await conn.query(
          `ALTER TABLE ${table} ADD COLUMN edpex_topic_id VARCHAR(10) NULL AFTER routine_category_id`,
        );
      }
      if ((await columnType(conn, table, "edpex_area_id")) == null) {
        console.log(`Adding ${table}.edpex_area_id…`);
        await conn.query(
          `ALTER TABLE ${table} ADD COLUMN edpex_area_id VARCHAR(20) NULL AFTER edpex_topic_id`,
        );
      }
    }
    if (!(await fkExists(conn, "fk_lkpi_edpex_topic"))) {
      console.log("Adding FK fk_lkpi_edpex_topic…");
      await conn.query(
        `ALTER TABLE library_kpi
           ADD CONSTRAINT fk_lkpi_edpex_topic FOREIGN KEY (edpex_topic_id)
           REFERENCES edpex_topic(id) ON DELETE SET NULL`,
      );
    }
    if (!(await fkExists(conn, "fk_lkpi_edpex_area"))) {
      console.log("Adding FK fk_lkpi_edpex_area…");
      await conn.query(
        `ALTER TABLE library_kpi
           ADD CONSTRAINT fk_lkpi_edpex_area FOREIGN KEY (edpex_area_id)
           REFERENCES edpex_area(id) ON DELETE SET NULL`,
      );
    }
    if (!(await indexExists(conn, "library_kpi", "idx_lkpi_edpex_topic"))) {
      await conn.query("CREATE INDEX idx_lkpi_edpex_topic ON library_kpi(edpex_topic_id)");
    }
    if (!(await indexExists(conn, "library_kpi", "idx_lkpi_edpex_area"))) {
      await conn.query("CREATE INDEX idx_lkpi_edpex_area ON library_kpi(edpex_area_id)");
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
