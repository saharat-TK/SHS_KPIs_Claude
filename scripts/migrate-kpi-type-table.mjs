// One-off migration: promote KPI type to a table, and split categories into the
// Strategic / Routine taxonomies.
//
//   node --env-file=.env.local scripts/migrate-kpi-type-table.mjs
//
// Idempotent. Steps:
//   1. Create `kpi_type` + seed its three rows.
//   2. kpi_categories: add `kpi_type`, backfill everything to 'strategic', FK + index.
//   3. library_kpi / perf_kpi: ENUM kpi_type -> VARCHAR(20) (values already match,
//      so no data is rewritten), + FK on library_kpi only.
//   4. library_kpi / perf_kpi: add `routine_category_id`, + FK/index on library_kpi only.
//   5. Seed the seven Routine areas (ด้านที่ 1–7) for strategic set 2.
//
// perf_* tables deliberately take no FKs: a snapshot must survive its source
// category being deleted or the set being cloned (schema decision #4).
import mysql from "mysql2/promise";

const ROUTINE_SET_ID = 2;

// Explicit ids: slugify() strips non-ASCII, so these Thai names would otherwise
// collapse to the bare ids "1".."7".
const ROUTINE_CATEGORIES = [
  {
    id: "routine_area_1",
    name: "ด้านที่ 1-การผลิตบัณฑิต",
    description: "ด้านที่ 1-การผลิตบัณฑิต",
  },
  {
    id: "routine_area_2",
    name: "ด้านที่ 2-ด้านการวิจัยและนวัตกรรม",
    description:
      "ด้านที่ 2-การเสริมสร้างความเข้มแข็งด้านการวิจัย/นวัตกรรมด้านวิทยาศาสตร์สุขภาพ",
  },
  {
    id: "routine_area_3",
    name: "ด้านที่ 3-การสร้างรายได้จากบริการวิชาการ",
    description: "ด้านที่ 3-การสร้างรายได้จากบริการวิชาการ",
  },
  {
    id: "routine_area_4",
    name: "ด้านที่ 4-การบริหารจัดการสำนักวิชาฯ",
    description: "ด้านที่ 4-การบริหารจัดการสำนักวิชาฯ",
  },
  {
    id: "routine_area_5",
    name: "ด้านที่ 5-สืบสานความคงอยู่ด้านศิลปวัฒนธรรม",
    description: "ด้านที่ 5-สืบสานความคงอยู่ด้านศิลปวัฒนธรรมและความเป็นไทย",
  },
  {
    id: "routine_area_6",
    name: "ด้านที่ 6-ด้านตลาด ลูกค้าสัมพันธ์ และความเป็นนานาชาติ",
    description: "ด้านที่ 6-ด้านตลาด ลูกค้าสัมพันธ์ และความเป็นนานาชาติ",
  },
  {
    id: "routine_area_7",
    name: "ด้านที่ 7-ระบบสารสนเทศเพื่อการตัดสินใจ",
    description: "ด้านที่ 7-การพัฒนาระบบสารสนเทศเพื่อการตัดสินใจ",
  },
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
    multipleStatements: true,
  });
  try {
    await conn.query("SET NAMES utf8mb4");
    await conn.beginTransaction();

    // ── 1. kpi_type ────────────────────────────────────────────────────────
    // DDL auto-commits in MySQL, so every step is guarded independently rather
    // than relying on the surrounding transaction.
    if (!(await tableExists(conn, "kpi_type"))) {
      console.log("Creating kpi_type…");
      await conn.query(`
        CREATE TABLE kpi_type (
          id                    VARCHAR(20)  PRIMARY KEY,
          kpi_type_name         VARCHAR(50)  NOT NULL,
          sort_order            INT          NOT NULL DEFAULT 0,
          applies_to_categories TINYINT(1)   NOT NULL DEFAULT 1,
          created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } else {
      console.log("kpi_type already exists — skipping create.");
    }
    // Operational is a KPI-only type: a category is either Strategic or Routine.
    const [seeded] = await conn.query(
      `INSERT IGNORE INTO kpi_type (id, kpi_type_name, sort_order, applies_to_categories) VALUES
         ('strategic',   'Strategic',   1, 1),
         ('operational', 'Operational', 2, 0),
         ('routine',     'Routine',     3, 1)`,
    );
    console.log(`kpi_type seed: ${seeded.affectedRows} row(s) inserted.`);

    // ── 2. kpi_categories.kpi_type ─────────────────────────────────────────
    if ((await columnType(conn, "kpi_categories", "kpi_type")) == null) {
      console.log("Adding kpi_categories.kpi_type…");
      await conn.query(
        "ALTER TABLE kpi_categories ADD COLUMN kpi_type VARCHAR(20) NOT NULL DEFAULT 'strategic' AFTER set_id",
      );
    }
    // Every pre-existing category is Strategic — that keeps today's category
    // tab bars and the Category dropdown showing exactly what they showed before.
    const [backfill] = await conn.query(
      "UPDATE kpi_categories SET kpi_type = 'strategic' WHERE kpi_type IS NULL OR kpi_type = ''",
    );
    if (backfill.affectedRows > 0) {
      console.log(`Backfilled ${backfill.affectedRows} categories to 'strategic'.`);
    }
    if (!(await fkExists(conn, "fk_kpi_categories_type"))) {
      console.log("Adding FK fk_kpi_categories_type…");
      await conn.query(
        `ALTER TABLE kpi_categories
           ADD CONSTRAINT fk_kpi_categories_type FOREIGN KEY (kpi_type)
           REFERENCES kpi_type(id) ON DELETE RESTRICT`,
      );
    }
    if (!(await indexExists(conn, "kpi_categories", "idx_kpi_categories_type"))) {
      await conn.query(
        "CREATE INDEX idx_kpi_categories_type ON kpi_categories(set_id, kpi_type, sort_order)",
      );
    }

    // ── 3. library_kpi / perf_kpi: ENUM kpi_type -> VARCHAR(20) ─────────────
    // The enum's values are already exactly kpi_type.id, so this rewrites no data.
    for (const table of ["library_kpi", "perf_kpi"]) {
      const t = await columnType(conn, table, "kpi_type");
      if (t == null) {
        throw new Error(`${table}.kpi_type not found — is this the right database?`);
      }
      if (t.toLowerCase().startsWith("enum")) {
        console.log(`Converting ${table}.kpi_type (${t} → varchar(20))…`);
        await conn.query(`ALTER TABLE ${table} MODIFY COLUMN kpi_type VARCHAR(20) NOT NULL`);
      }
    }
    if (!(await fkExists(conn, "fk_lkpi_type"))) {
      console.log("Adding FK fk_lkpi_type…");
      await conn.query(
        `ALTER TABLE library_kpi
           ADD CONSTRAINT fk_lkpi_type FOREIGN KEY (kpi_type)
           REFERENCES kpi_type(id) ON DELETE RESTRICT`,
      );
    }

    // ── 4. routine_category_id ─────────────────────────────────────────────
    for (const table of ["library_kpi", "perf_kpi"]) {
      if ((await columnType(conn, table, "routine_category_id")) == null) {
        console.log(`Adding ${table}.routine_category_id…`);
        await conn.query(
          `ALTER TABLE ${table} ADD COLUMN routine_category_id VARCHAR(40) NULL AFTER category_id`,
        );
      }
    }
    if (!(await fkExists(conn, "fk_lkpi_routine_category"))) {
      console.log("Adding FK fk_lkpi_routine_category…");
      await conn.query(
        `ALTER TABLE library_kpi
           ADD CONSTRAINT fk_lkpi_routine_category FOREIGN KEY (routine_category_id)
           REFERENCES kpi_categories(id) ON DELETE SET NULL`,
      );
    }
    if (!(await indexExists(conn, "library_kpi", "idx_lkpi_routine_category"))) {
      await conn.query(
        "CREATE INDEX idx_lkpi_routine_category ON library_kpi(routine_category_id)",
      );
    }

    // ── 5. Seed the seven Routine areas for set 2 ──────────────────────────
    const [[setRow]] = await conn.query("SELECT id FROM strategic_set WHERE id = ?", [
      ROUTINE_SET_ID,
    ]);
    if (!setRow) {
      throw new Error(
        `strategic_set ${ROUTINE_SET_ID} does not exist — the routine categories have nowhere to go. ` +
          `Create that set first, or edit ROUTINE_SET_ID in this script.`,
      );
    }
    let inserted = 0;
    for (const [i, c] of ROUTINE_CATEGORIES.entries()) {
      const [res] = await conn.query(
        `INSERT IGNORE INTO kpi_categories (id, set_id, kpi_type, name, description, sort_order)
         VALUES (?, ?, 'routine', ?, ?, ?)`,
        [c.id, ROUTINE_SET_ID, c.name, c.description, i + 1],
      );
      inserted += res.affectedRows;
    }
    console.log(
      `Routine categories for set ${ROUTINE_SET_ID}: ${inserted} inserted, ` +
        `${ROUTINE_CATEGORIES.length - inserted} already present.`,
    );

    await conn.commit();
    console.log("Migration complete.");
  } catch (err) {
    await conn.rollback();
    console.error("Migration failed, rolled back:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
