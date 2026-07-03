-- =============================================================================
--  SHS KPI Management — MySQL / MariaDB schema
--  Target DB: shs_kpis_claude @ 127.0.0.1:3306 (XAMPP MariaDB 10.4)
--  Same database as SHS_Faculty_Committee_schema.sql and
--  SHS_KPI_Category_schema.sql — reuses committees / faculty / kpi_categories.
--
--  Two layers (see decisions below):
--    LIBRARY      — versioned, admin-authored templates ("5-Year Strategic Set")
--    PERFORMANCE  — activated snapshots of a library set, used for data entry
--
--  Design decisions locked with the product owner (2026-07-03):
--    1. A set spans 5 INCLUSIVE years:  end_year = start_year + 4  (5 target rows).
--    2. Categories are GLOBAL: KPIs/metrics reference the existing
--       `kpi_categories` table; sets do NOT own their own category list.
--    3. One committee_in_charge + one person_in_charge per KPI and per metric.
--    4. Library->Performance sync is a FULL re-sync (definitions AND targets
--       overwrite the snapshot) EXCEPT already-entered quarterly progress,
--       which is preserved. Snapshot rows keep source_*_id back-pointers so a
--       re-sync can match library rows to their performance copies.
--    5. five_year_target is a CUMULATIVE SUM CAP: SUM(the 5 annual targets)
--       must not exceed five_year_target (app-enforced). Each single year may
--       also not exceed it. Same rule for KPIs and metrics.
--    6. Metrics carry their OWN green/amber thresholds (same as KPIs) so the
--       metric progress bar can show colour bands.
--    7. Calculation logic is BOTH: calculation_type covers simple weighted/
--       average roll-ups; an optional formula_id links a KPI to the reusable
--       formulas engine (formula / formula_version / formula_variable below)
--       for custom_formula KPIs. Formulas are GLOBAL (reusable across sets).
--    8. Hierarchy is ONE LEVEL ONLY: KPI -> metric (a metric is always a leaf).
--       No nested sub-KPIs; no parent_id / recursion.
--
--  Conventions: snake_case; BIGINT UNSIGNED AUTO_INCREMENT surrogate PKs for the
--  new relational graph (cleaner FKs than the "cmt-*/fac-*" string ids used by
--  the older tables); FKs into existing string-keyed tables keep their types;
--  created_at/updated_at on every table; InnoDB + utf8mb4 for Thai text.
-- =============================================================================

SET NAMES utf8mb4;

-- ####################   LAYER A — LIBRARY (admin templates)   #################

-- ── strategic_set ────────────────────────────────────────────────────────────
-- One row per 5-year strategic set. Optionally cloned from a previous set.
CREATE TABLE strategic_set (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(255) NOT NULL,                 -- e.g. "SHS Strategic Set 2568–2572"
  description        VARCHAR(1000) NULL,
  start_year         SMALLINT NOT NULL,                     -- Buddhist-era year, e.g. 2568
  end_year           SMALLINT AS (start_year + 4) STORED,   -- inclusive 5-year span (decision #1)
  status             ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
  cloned_from_set_id BIGINT UNSIGNED NULL,                  -- self-FK: source set when cloned
  created_by         VARCHAR(255) NULL,                     -- app_user email
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_set_clone FOREIGN KEY (cloned_from_set_id)
    REFERENCES strategic_set(id) ON DELETE SET NULL,
  UNIQUE KEY uq_set_start_year (start_year)                 -- one set may start per year; drop if overlaps allowed
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── formula ──────────────────────────────────────────────────────────────────
-- Reusable calculation formula (decision #7). Mirrors the in-memory `Formula`
-- type in lib/types.ts (id, name, expression, variables, currentVersion) — this
-- is the first time the formula engine is persisted. GLOBAL: not scoped to a
-- set, so one formula can back custom_formula KPIs across many sets.
CREATE TABLE formula (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  expression      TEXT NOT NULL,                         -- mathjs-evaluable, uses variable symbols
  current_version VARCHAR(20) NULL,                      -- e.g. "v2.4"; points at latest formula_version.version
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── formula_variable ─────────────────────────────────────────────────────────
-- The symbols a formula's expression references. Mirrors FormulaVariable.
CREATE TABLE formula_variable (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_id BIGINT UNSIGNED NOT NULL,
  symbol     VARCHAR(40)  NOT NULL,                      -- e.g. "G"
  label      VARCHAR(255) NOT NULL,                      -- e.g. "Graduates"
  source     VARCHAR(500) NULL,                          -- where the value comes from
  UNIQUE KEY uq_formula_symbol (formula_id, symbol),
  CONSTRAINT fk_fvar_formula FOREIGN KEY (formula_id) REFERENCES formula(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── formula_version ──────────────────────────────────────────────────────────
-- Immutable version history of a formula's expression. Mirrors FormulaVersion.
CREATE TABLE formula_version (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  formula_id  BIGINT UNSIGNED NOT NULL,
  version     VARCHAR(20)  NOT NULL,                     -- e.g. "v2.4"
  expression  TEXT NOT NULL,
  author      VARCHAR(255) NULL,
  change_note VARCHAR(1000) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_formula_version (formula_id, version),
  CONSTRAINT fk_fver_formula FOREIGN KEY (formula_id) REFERENCES formula(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── library_kpi ──────────────────────────────────────────────────────────────
-- A KPI definition inside a set. Core config + 5-year target + calc logic.
CREATE TABLE library_kpi (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  set_id              BIGINT UNSIGNED NOT NULL,
  -- Core configuration
  name                VARCHAR(500) NOT NULL,
  description         TEXT NULL,
  category_id         VARCHAR(40)  NULL,                    -- FK -> kpi_categories.id (global)
  kpi_type            ENUM('strategic','operational','routine') NOT NULL,
  data_collect_method VARCHAR(500) NULL,                    -- "Data collecting method"
  collection_period   ENUM('Q1','Q2','Q3','Q4','every_quarter') NOT NULL,
  data_source_url     VARCHAR(1000) NULL,                   -- "Data source (link url)"
  committee_id        VARCHAR(30)  NULL,                    -- FK -> committees.id (single, decision #3)
  person_in_charge_id VARCHAR(20)  NULL,                    -- FK -> faculty.id     (single, decision #3)
  -- Annual target (5 years)
  weight              DECIMAL(6,2) NOT NULL DEFAULT 0,      -- relative weight
  unit                VARCHAR(50)  NULL,                    -- "%", "score", "ratio", "จำนวน"
  five_year_target    DECIMAL(14,4) NULL,                   -- cumulative cap: SUM(5 yearly targets) <= this (decision #5)
  -- Calculation logic + roll-up (decision #7: BOTH simple type AND optional formula)
  calculation_type    ENUM('weighted_sum','simple_average','custom_formula') NOT NULL DEFAULT 'weighted_sum',
  calculation_logic   TEXT NULL,                            -- free-text notes / description of the logic
  formula_id          BIGINT UNSIGNED NULL,                 -- FK -> formula.id; used when calculation_type='custom_formula'
  -- Threshold setting
  threshold_green     DECIMAL(14,4) NULL,                   -- >= green  => healthy
  threshold_amber     DECIMAL(14,4) NULL,                   -- >= amber  => watch
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lkpi_set       FOREIGN KEY (set_id)              REFERENCES strategic_set(id)  ON DELETE CASCADE,
  CONSTRAINT fk_lkpi_category  FOREIGN KEY (category_id)         REFERENCES kpi_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_lkpi_committee FOREIGN KEY (committee_id)        REFERENCES committees(id)     ON DELETE SET NULL,
  CONSTRAINT fk_lkpi_person    FOREIGN KEY (person_in_charge_id) REFERENCES faculty(id)        ON DELETE SET NULL,
  CONSTRAINT fk_lkpi_formula   FOREIGN KEY (formula_id)          REFERENCES formula(id)        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_lkpi_set      ON library_kpi(set_id);
CREATE INDEX idx_lkpi_category ON library_kpi(category_id);

-- ── library_kpi_annual_target ────────────────────────────────────────────────
-- Per-year target for a KPI. year_no 1..5 maps to start_year..start_year+4.
-- App enforces "each year's target <= five_year_target" (see NOTE at bottom).
CREATE TABLE library_kpi_annual_target (
  kpi_id       BIGINT UNSIGNED NOT NULL,
  year_no      TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  target_value DECIMAL(14,4) NULL,
  PRIMARY KEY (kpi_id, year_no),
  CONSTRAINT fk_lkpitgt_kpi FOREIGN KEY (kpi_id) REFERENCES library_kpi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── library_metric ───────────────────────────────────────────────────────────
-- Sub-KPI / metric under a library KPI. Same core-config shape as the KPI.
CREATE TABLE library_metric (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kpi_id              BIGINT UNSIGNED NOT NULL,
  name                VARCHAR(500) NOT NULL,
  description         TEXT NULL,
  category_id         VARCHAR(40)  NULL,                    -- FK -> kpi_categories.id
  data_collect_method VARCHAR(500) NULL,
  collection_period   ENUM('Q1','Q2','Q3','Q4','every_quarter') NOT NULL,
  data_source_url     VARCHAR(1000) NULL,
  committee_id        VARCHAR(30)  NULL,                    -- FK -> committees.id
  person_in_charge_id VARCHAR(20)  NULL,                    -- FK -> faculty.id
  weight              DECIMAL(6,2) NOT NULL DEFAULT 0,
  unit                VARCHAR(50)  NULL,
  five_year_target    DECIMAL(14,4) NULL,
  -- Threshold setting (decision #6: metrics carry their own colour bands)
  threshold_green     DECIMAL(14,4) NULL,                   -- >= green  => healthy
  threshold_amber     DECIMAL(14,4) NULL,                   -- >= amber  => watch
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lmet_kpi       FOREIGN KEY (kpi_id)              REFERENCES library_kpi(id)    ON DELETE CASCADE,
  CONSTRAINT fk_lmet_category  FOREIGN KEY (category_id)         REFERENCES kpi_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_lmet_committee FOREIGN KEY (committee_id)        REFERENCES committees(id)     ON DELETE SET NULL,
  CONSTRAINT fk_lmet_person    FOREIGN KEY (person_in_charge_id) REFERENCES faculty(id)        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_lmet_kpi ON library_metric(kpi_id);

-- ── library_metric_annual_target ─────────────────────────────────────────────
CREATE TABLE library_metric_annual_target (
  metric_id    BIGINT UNSIGNED NOT NULL,
  year_no      TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  target_value DECIMAL(14,4) NULL,
  PRIMARY KEY (metric_id, year_no),
  CONSTRAINT fk_lmettgt_metric FOREIGN KEY (metric_id) REFERENCES library_metric(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ##############   LAYER B — PERFORMANCE (activated snapshots)   ###############

-- ── performance_record ───────────────────────────────────────────────────────
-- One activation of a library set. Snapshots below are copied on activation and
-- overwritten on re-sync (entered progress excepted).
CREATE TABLE performance_record (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_set_id  BIGINT UNSIGNED NOT NULL,                 -- library strategic_set copied from
  name           VARCHAR(255) NOT NULL,
  start_year     SMALLINT NOT NULL,
  end_year       SMALLINT AS (start_year + 4) STORED,
  status         ENUM('active','closed','archived') NOT NULL DEFAULT 'active',
  activated_by   VARCHAR(255) NULL,
  activated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP NULL,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_set FOREIGN KEY (source_set_id) REFERENCES strategic_set(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── perf_kpi ─────────────────────────────────────────────────────────────────
-- Snapshot of a library_kpi. Carries source_kpi_id so re-sync can match rows.
CREATE TABLE perf_kpi (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  record_id           BIGINT UNSIGNED NOT NULL,
  source_kpi_id       BIGINT UNSIGNED NULL,                -- original library_kpi.id (decision #4)
  -- Copied definition (same columns as library_kpi)
  name                VARCHAR(500) NOT NULL,
  description         TEXT NULL,
  category_id         VARCHAR(40)  NULL,
  kpi_type            ENUM('strategic','operational','routine') NOT NULL,
  data_collect_method VARCHAR(500) NULL,
  collection_period   ENUM('Q1','Q2','Q3','Q4','every_quarter') NOT NULL,
  data_source_url     VARCHAR(1000) NULL,
  committee_id        VARCHAR(30)  NULL,
  person_in_charge_id VARCHAR(20)  NULL,
  weight              DECIMAL(6,2) NOT NULL DEFAULT 0,
  unit                VARCHAR(50)  NULL,
  five_year_target    DECIMAL(14,4) NULL,
  calculation_type    ENUM('weighted_sum','simple_average','custom_formula') NOT NULL DEFAULT 'weighted_sum',
  calculation_logic   TEXT NULL,
  formula_id          BIGINT UNSIGNED NULL,               -- copied FK -> formula.id (formulas are global, not snapshotted)
  threshold_green     DECIMAL(14,4) NULL,
  threshold_amber     DECIMAL(14,4) NULL,
  sort_order          INT NOT NULL DEFAULT 0,
  has_children        BOOLEAN NOT NULL DEFAULT 0,          -- true => progress is auto-calculated from metrics
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pkpi_record  FOREIGN KEY (record_id)     REFERENCES performance_record(id) ON DELETE CASCADE,
  CONSTRAINT fk_pkpi_source  FOREIGN KEY (source_kpi_id) REFERENCES library_kpi(id)        ON DELETE SET NULL,
  CONSTRAINT fk_pkpi_formula FOREIGN KEY (formula_id)    REFERENCES formula(id)            ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pkpi_record ON perf_kpi(record_id);
CREATE INDEX idx_pkpi_source ON perf_kpi(source_kpi_id);

-- ── perf_kpi_annual_target ───────────────────────────────────────────────────
CREATE TABLE perf_kpi_annual_target (
  perf_kpi_id  BIGINT UNSIGNED NOT NULL,
  year_no      TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  target_value DECIMAL(14,4) NULL,
  PRIMARY KEY (perf_kpi_id, year_no),
  CONSTRAINT fk_pkpitgt FOREIGN KEY (perf_kpi_id) REFERENCES perf_kpi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── perf_kpi_quarter_progress ────────────────────────────────────────────────
-- The recorded data. quarter_target = (year target / 4) accumulated Q1..Q4 —
-- computed on read from perf_kpi_annual_target, not stored, so a target change
-- is reflected automatically. progress_value is entered directly for leaf KPIs,
-- or written by the calc engine when has_children = 1. Issue + solution are the
-- required "Issue" section for each quarter.
CREATE TABLE perf_kpi_quarter_progress (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  perf_kpi_id    BIGINT UNSIGNED NOT NULL,
  year_no        TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  quarter_no     TINYINT UNSIGNED NOT NULL CHECK (quarter_no BETWEEN 1 AND 4),
  progress_value DECIMAL(14,4) NULL,                       -- accumulated current value
  is_computed    BOOLEAN NOT NULL DEFAULT 0,               -- 1 => derived from metrics, not entered
  issue          TEXT NULL,                                -- required: problem/difficulty getting the data
  solution       TEXT NULL,                                -- required: how it will be addressed
  recorded_by    VARCHAR(255) NULL,
  recorded_at    TIMESTAMP NULL,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pkpi_period (perf_kpi_id, year_no, quarter_no),
  CONSTRAINT fk_pkpiqp FOREIGN KEY (perf_kpi_id) REFERENCES perf_kpi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── perf_metric ──────────────────────────────────────────────────────────────
CREATE TABLE perf_metric (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  perf_kpi_id         BIGINT UNSIGNED NOT NULL,
  source_metric_id    BIGINT UNSIGNED NULL,                -- original library_metric.id
  name                VARCHAR(500) NOT NULL,
  description         TEXT NULL,
  category_id         VARCHAR(40)  NULL,
  data_collect_method VARCHAR(500) NULL,
  collection_period   ENUM('Q1','Q2','Q3','Q4','every_quarter') NOT NULL,
  data_source_url     VARCHAR(1000) NULL,
  committee_id        VARCHAR(30)  NULL,
  person_in_charge_id VARCHAR(20)  NULL,
  weight              DECIMAL(6,2) NOT NULL DEFAULT 0,
  unit                VARCHAR(50)  NULL,
  five_year_target    DECIMAL(14,4) NULL,
  threshold_green     DECIMAL(14,4) NULL,                 -- decision #6: metric colour bands
  threshold_amber     DECIMAL(14,4) NULL,
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pmet_kpi    FOREIGN KEY (perf_kpi_id)      REFERENCES perf_kpi(id)       ON DELETE CASCADE,
  CONSTRAINT fk_pmet_source FOREIGN KEY (source_metric_id) REFERENCES library_metric(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pmet_kpi ON perf_metric(perf_kpi_id);

-- ── perf_metric_annual_target ────────────────────────────────────────────────
CREATE TABLE perf_metric_annual_target (
  perf_metric_id BIGINT UNSIGNED NOT NULL,
  year_no        TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  target_value   DECIMAL(14,4) NULL,
  PRIMARY KEY (perf_metric_id, year_no),
  CONSTRAINT fk_pmettgt FOREIGN KEY (perf_metric_id) REFERENCES perf_metric(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── perf_metric_quarter_progress ─────────────────────────────────────────────
-- Metrics are always entered directly (leaf level), each with its Issue section.
CREATE TABLE perf_metric_quarter_progress (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  perf_metric_id BIGINT UNSIGNED NOT NULL,
  year_no        TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  quarter_no     TINYINT UNSIGNED NOT NULL CHECK (quarter_no BETWEEN 1 AND 4),
  progress_value DECIMAL(14,4) NULL,
  issue          TEXT NULL,
  solution       TEXT NULL,
  recorded_by    VARCHAR(255) NULL,
  recorded_at    TIMESTAMP NULL,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pmet_period (perf_metric_id, year_no, quarter_no),
  CONSTRAINT fk_pmetqp FOREIGN KEY (perf_metric_id) REFERENCES perf_metric(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
--  NOTES / rules enforced in the application layer (not by DDL)
--  * five_year_target is a CUMULATIVE SUM CAP (decision #5): on save of any
--    library_*_annual_target / perf_*_annual_target, enforce BOTH
--      SUM(the 5 year targets) <= five_year_target   AND
--      each single year target  <= five_year_target.
--    (A CHECK can't SUM sibling rows or compare across tables.)
--  * custom_formula KPIs (decision #7): when calculation_type='custom_formula',
--    formula_id must be set; the roll-up evaluates formula.expression (mathjs)
--    over the child metric values. weighted_sum/simple_average ignore formula_id.
--  * Metric thresholds (decision #6): threshold_green/amber now exist on
--    library_metric & perf_metric — drive the metric's current-value bar the
--    same way KPI thresholds drive the KPI bar.
--  * Accumulated quarter target = running sum of (year_target / 4) across
--    Q1..Q4; computed on read, not stored.
--  * Roll-up for has_children KPIs uses calculation_type + calculation_logic
--    over child perf_metric quarter values; result written to
--    perf_kpi_quarter_progress.progress_value with is_computed = 1.
--  * Full re-sync (decision #4): match perf rows to library rows by
--    source_kpi_id / source_metric_id; INSERT new, UPDATE definitions + targets,
--    and soft-handle library rows deleted after activation (recommend a
--    `retired_at` column rather than hard delete if progress exists).
-- =============================================================================
