// Migration: add LAYER D — data sources (committee-owned raw data).
//
//   node --env-file=.env.local scripts/migrate-data-sources.mjs
//
// Idempotent: each CREATE TABLE is guarded by an information_schema check, so
// re-running is a no-op. Mirrors the DDL in
// schema/SHS_KPI_Management_schema.sql (LAYER D) — keep the two in sync.
//
// DDL auto-commits in MySQL/MariaDB, so this script does not open a transaction;
// the guards are what make it safe to re-run.
import mysql from "mysql2/promise";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?`,
    [table],
  );
  return rows.length > 0;
}

async function columnType(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS t FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows[0]?.t ?? null;
}

// Column-level upgrades for databases created before a given feature landed.
// Each entry is guarded by its own check, so re-running is a no-op.
const COLUMN_TYPE_DDL = `ENUM('text','url','number','date','select','boolean','faculty','program') NOT NULL DEFAULT 'text'`;

async function columnExists(conn, table, column) {
  return (await columnType(conn, table, column)) != null;
}

/** Links moved from three reserved single-purpose columns to one `mappings` JSON
 *  that can express filters and two slots. Nothing ever read the old columns. */
async function ensureLinkMappings(conn) {
  if (!(await columnExists(conn, "data_source_link", "mappings"))) {
    console.log("Adding data_source_link.mappings…");
    await conn.query(
      "ALTER TABLE data_source_link ADD COLUMN mappings JSON NULL AFTER library_metric_id",
    );
  }
  for (const dead of ["column_key", "variable_slot", "aggregation"]) {
    if (await columnExists(conn, "data_source_link", dead)) {
      console.log(`Dropping superseded data_source_link.${dead}…`);
      await conn.query(`ALTER TABLE data_source_link DROP COLUMN ${dead}`);
    }
  }
}

/** Metric progress needs to distinguish a fed value from a typed one. */
async function ensureMetricIsComputed(conn) {
  if (await columnExists(conn, "perf_metric_quarter_progress", "is_computed")) {
    console.log("perf_metric_quarter_progress.is_computed already exists — skipping.");
    return;
  }
  console.log("Adding perf_metric_quarter_progress.is_computed…");
  await conn.query(
    `ALTER TABLE perf_metric_quarter_progress
       ADD COLUMN is_computed TINYINT(1) NOT NULL DEFAULT 0 AFTER progress_value`,
  );
}

async function ensureColumnTypes(conn) {
  const current = await columnType(conn, "data_source_column", "data_type");
  if (current == null) return; // table was just created with the full ENUM
  if (
    current.includes("'url'") &&
    current.includes("'faculty'") &&
    current.includes("'program'")
  ) {
    console.log("data_source_column.data_type already has all column types — skipping.");
    return;
  }
  console.log("Adding missing data_source_column.data_type values…");
  await conn.query(
    `ALTER TABLE data_source_column MODIFY COLUMN data_type ${COLUMN_TYPE_DDL}`,
  );
}

const TABLES = [
  [
    "data_source",
    `CREATE TABLE data_source (
       id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       name          VARCHAR(255) NOT NULL,
       description   VARCHAR(1000) NULL,
       committee_id  VARCHAR(30)  NOT NULL,
       period_grain  ENUM('quarterly','annual') NOT NULL DEFAULT 'quarterly',
       status        ENUM('active','archived') NOT NULL DEFAULT 'active',
       created_by    VARCHAR(20)  NULL,
       created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       CONSTRAINT fk_ds_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE RESTRICT,
       CONSTRAINT fk_ds_creator   FOREIGN KEY (created_by)   REFERENCES faculty(id)    ON DELETE SET NULL
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    ["CREATE INDEX idx_ds_committee ON data_source(committee_id, status)"],
  ],
  [
    "data_source_column",
    `CREATE TABLE data_source_column (
       id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       data_source_id BIGINT UNSIGNED NOT NULL,
       col_key        VARCHAR(40)  NOT NULL,
       label          VARCHAR(255) NOT NULL,
       data_type      ENUM('text','url','number','date','select','boolean','faculty','program') NOT NULL DEFAULT 'text',
       unit           VARCHAR(50)  NULL,
       options        JSON NULL,
       is_required    TINYINT(1) NOT NULL DEFAULT 0,
       sort_order     INT NOT NULL DEFAULT 0,
       created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       UNIQUE KEY uq_ds_col (data_source_id, col_key),
       CONSTRAINT fk_dsc_source FOREIGN KEY (data_source_id) REFERENCES data_source(id) ON DELETE CASCADE
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    ["CREATE INDEX idx_dsc_sort ON data_source_column(data_source_id, sort_order)"],
  ],
  [
    "data_source_entry",
    `CREATE TABLE data_source_entry (
       id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       data_source_id BIGINT UNSIGNED NOT NULL,
       year           SMALLINT NOT NULL,
       quarter        TINYINT UNSIGNED NULL CHECK (quarter IS NULL OR quarter BETWEEN 1 AND 4),
       values_json    JSON NOT NULL,
       note           TEXT NULL,
       recorded_by    VARCHAR(20) NULL,
       created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       CONSTRAINT fk_dse_source   FOREIGN KEY (data_source_id) REFERENCES data_source(id) ON DELETE CASCADE,
       CONSTRAINT fk_dse_recorder FOREIGN KEY (recorded_by)    REFERENCES faculty(id)     ON DELETE SET NULL
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    ["CREATE INDEX idx_dse_period ON data_source_entry(data_source_id, year, quarter)"],
  ],
  [
    "data_source_link",
    `CREATE TABLE data_source_link (
       id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       data_source_id    BIGINT UNSIGNED NOT NULL,
       library_kpi_id    BIGINT UNSIGNED NULL,
       library_metric_id BIGINT UNSIGNED NULL,
       mappings          JSON NULL,
       note              VARCHAR(1000) NULL,
       target_key        VARCHAR(32) AS (CONCAT(IF(library_kpi_id IS NULL, 'm', 'k'),
                                                COALESCE(library_kpi_id, library_metric_id))) STORED,
       created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       UNIQUE KEY uq_ds_link (data_source_id, target_key),
       CONSTRAINT chk_dsl_one_target CHECK ((library_kpi_id IS NULL) <> (library_metric_id IS NULL)),
       CONSTRAINT fk_dsl_source FOREIGN KEY (data_source_id)    REFERENCES data_source(id)    ON DELETE CASCADE,
       CONSTRAINT fk_dsl_kpi    FOREIGN KEY (library_kpi_id)    REFERENCES library_kpi(id)    ON DELETE CASCADE,
       CONSTRAINT fk_dsl_metric FOREIGN KEY (library_metric_id) REFERENCES library_metric(id) ON DELETE CASCADE
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    [
      "CREATE INDEX idx_dsl_kpi    ON data_source_link(library_kpi_id)",
      "CREATE INDEX idx_dsl_metric ON data_source_link(library_metric_id)",
    ],
  ],
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    for (const [table, ddl, indexes] of TABLES) {
      if (await tableExists(conn, table)) {
        console.log(`${table} already exists — skipping.`);
        continue;
      }
      console.log(`Creating ${table}…`);
      await conn.query(ddl);
      for (const idx of indexes) await conn.query(idx);
    }

    await ensureColumnTypes(conn);
    await ensureLinkMappings(conn);
    await ensureMetricIsComputed(conn);
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
