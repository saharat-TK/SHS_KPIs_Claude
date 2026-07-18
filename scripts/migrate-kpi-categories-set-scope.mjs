// One-off migration: make kpi_categories set-scoped.
//
//   node --env-file=.env.local scripts/migrate-kpi-categories-set-scope.mjs
//
// Idempotent. Steps:
//   1. Add `set_id` column + FK + index if missing.
//   2. Stamp existing NULL-set categories onto the ROOT set (MIN strategic_set id).
//   3. For every OTHER set that has no categories yet: clone the root's categories
//      into fresh unique ids, then rewrite that set's library_kpi / library_metric
//      category_id from the old (root) id to its own copy.
import mysql from "mysql2/promise";

const slugify = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

async function uniqueCategoryId(conn, base) {
  let id = slugify(base) || "category";
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [rows] = await conn.query("SELECT id FROM kpi_categories WHERE id = ?", [id]);
    if (rows.length === 0) return id;
    n += 1;
    id = `${slugify(base)}_${n}`.slice(0, 40);
  }
}

async function columnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows[0]?.t ?? null;
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
    await conn.beginTransaction();

    // 1. Schema: ensure set_id column (BIGINT UNSIGNED to match strategic_set.id)
    // + FK + index. DDL auto-commits in MySQL, so each step is guarded and idempotent.
    const t = await columnType(conn, "kpi_categories", "set_id");
    if (t == null) {
      console.log("Adding kpi_categories.set_id column…");
      await conn.query("ALTER TABLE kpi_categories ADD COLUMN set_id BIGINT UNSIGNED NULL AFTER id");
    } else if (!t.replace(/\s+/g, " ").toLowerCase().startsWith("bigint")) {
      console.log(`Fixing set_id type (${t} → bigint unsigned)…`);
      await conn.query("ALTER TABLE kpi_categories MODIFY COLUMN set_id BIGINT UNSIGNED NULL");
    }
    if (!(await fkExists(conn, "fk_kpi_categories_set"))) {
      console.log("Adding FK fk_kpi_categories_set…");
      await conn.query(
        `ALTER TABLE kpi_categories
           ADD CONSTRAINT fk_kpi_categories_set FOREIGN KEY (set_id)
           REFERENCES strategic_set(id) ON DELETE CASCADE`,
      );
    }
    if (!(await indexExists(conn, "kpi_categories", "idx_kpi_categories_set_sort"))) {
      await conn.query("CREATE INDEX idx_kpi_categories_set_sort ON kpi_categories(set_id, sort_order)");
    }

    // Root set = the earliest strategic set (typically the non-cloned original).
    const [[{ rootId } = {}]] = await conn.query(
      "SELECT MIN(id) AS rootId FROM strategic_set",
    );
    if (rootId == null) {
      console.log("No strategic sets found — nothing to backfill.");
      await conn.commit();
      return;
    }

    // 2. Stamp any still-global categories onto the root set.
    const [stamp] = await conn.query(
      "UPDATE kpi_categories SET set_id = ? WHERE set_id IS NULL",
      [rootId],
    );
    console.log(`Stamped ${stamp.affectedRows} global categories onto root set ${rootId}.`);

    // Root categories (the template to copy for other sets).
    const [rootCats] = await conn.query(
      "SELECT id, name, description, sort_order FROM kpi_categories WHERE set_id = ? ORDER BY sort_order, id",
      [rootId],
    );

    // 3. Give every other set its own copies + rewrite references.
    const [otherSets] = await conn.query(
      "SELECT id FROM strategic_set WHERE id <> ? ORDER BY id",
      [rootId],
    );
    for (const { id: setId } of otherSets) {
      const [[{ n } = {}]] = await conn.query(
        "SELECT COUNT(*) AS n FROM kpi_categories WHERE set_id = ?",
        [setId],
      );
      if (n > 0) {
        console.log(`Set ${setId} already has ${n} categories — skipping.`);
        continue;
      }
      console.log(`Cloning ${rootCats.length} categories into set ${setId}…`);
      for (const c of rootCats) {
        const newId = await uniqueCategoryId(conn, c.name);
        await conn.query(
          "INSERT INTO kpi_categories (id, set_id, name, description, sort_order) VALUES (?,?,?,?,?)",
          [newId, setId, c.name, c.description, c.sort_order],
        );
        // Rewrite this set's KPI + metric references from the root id → new copy.
        await conn.query(
          "UPDATE library_kpi SET category_id = ? WHERE set_id = ? AND category_id = ?",
          [newId, setId, c.id],
        );
        await conn.query(
          `UPDATE library_metric m
             JOIN library_kpi k ON k.id = m.kpi_id
              SET m.category_id = ?
            WHERE k.set_id = ? AND m.category_id = ?`,
          [newId, setId, c.id],
        );
      }
    }

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
