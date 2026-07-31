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
--    5. five_year_target is a PER-YEAR CAP: each annual target must not
--       exceed five_year_target (app-enforced). The sum of annual targets may
--       exceed it. Same rule for KPIs and metrics.
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

-- ── Academic catalog ────────────────────────────────────────────────────────
-- The authoritative five-program / nine-curriculum reference graph. It is
-- intentionally separate from faculty.program, whose legacy ENUM vocabulary
-- is not equivalent to these academic program codes.
CREATE TABLE academic_program (
  code       VARCHAR(20)  PRIMARY KEY,                 -- e.g. "PH"
  label_th   VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE curriculum (
  code         VARCHAR(20)  PRIMARY KEY,               -- e.g. "PHB"
  program_code VARCHAR(20)  NOT NULL,
  label_th     VARCHAR(255) NOT NULL,
  sort_order   INT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_curriculum_program FOREIGN KEY (program_code)
    REFERENCES academic_program(code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_curriculum_program ON curriculum(program_code, sort_order);

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
  five_year_target    DECIMAL(14,4) NULL,                   -- per-year cap for each annual target (decision #5)
  -- Calculation logic + roll-up (decision #7: BOTH simple type AND optional formula)
  calculation_type    ENUM('weighted_sum','simple_average','percent_of_total','ratio_of_total','combined_percent','combined_ratio','custom_formula') NOT NULL DEFAULT 'weighted_sum',
  calculation_logic   TEXT NULL,                            -- free-text notes / description of the logic
  formula_id          BIGINT UNSIGNED NULL,                 -- FK -> formula.id; used when calculation_type='custom_formula'
  -- Threshold setting
  threshold_green     DECIMAL(14,4) NULL,                   -- >= green  => healthy
  threshold_amber     DECIMAL(14,4) NULL,                   -- >= amber  => watch
  -- Quarterly target derivation (applies to this KPI and, inherited, its metrics)
  quarterly_target_mode ENUM('divide_equally','use_annual') NOT NULL DEFAULT 'divide_equally',
                                                            -- divide_equally: cumulative annual*q/4; use_annual: each quarter = annual target
  -- KPI variables (leaf-KPI data entry): value = V1 (or (V1/V2)*100 for Percent, V1/V2 for Ratio)
  variable1_name      VARCHAR(255) NULL,                    -- Variable 1 (Dividend) display name
  variable1_unit      VARCHAR(50)  NULL,                    -- Variable 1 unit
  variable2_name      VARCHAR(255) NULL,                    -- Variable 2 (Divisor); required when unit is Percent/Ratio
  variable2_unit      VARCHAR(50)  NULL,                    -- Variable 2 unit
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
  target_mode         ENUM('none','inherit_parent','manual') NOT NULL DEFAULT 'manual',
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
  status         ENUM('active','inactive','completed') NOT NULL DEFAULT 'active',
  activated_by   VARCHAR(255) NULL,
  activated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP NULL,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_perf_set FOREIGN KEY (source_set_id) REFERENCES strategic_set(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── performance_record_period ───────────────────────────────────────────────
-- Admin-managed recording availability for a performance record. Missing rows
-- are treated by the application as closed, so existing records are closed by
-- default until an admin opens specific years/quarters.
CREATE TABLE performance_record_period (
  record_id   BIGINT UNSIGNED NOT NULL,
  year_no     TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  quarter_no  TINYINT UNSIGNED NOT NULL CHECK (quarter_no BETWEEN 1 AND 4),
  is_open     BOOLEAN NOT NULL DEFAULT 0,
  opened_by   VARCHAR(255) NULL,
  opened_at   TIMESTAMP NULL,
  updated_by  VARCHAR(255) NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id, year_no, quarter_no),
  CONSTRAINT fk_perf_period_record FOREIGN KEY (record_id) REFERENCES performance_record(id) ON DELETE CASCADE
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
  calculation_type    ENUM('weighted_sum','simple_average','percent_of_total','ratio_of_total','combined_percent','combined_ratio','custom_formula') NOT NULL DEFAULT 'weighted_sum',
  calculation_logic   TEXT NULL,
  formula_id          BIGINT UNSIGNED NULL,               -- copied FK -> formula.id (formulas are global, not snapshotted)
  threshold_green     DECIMAL(14,4) NULL,
  threshold_amber     DECIMAL(14,4) NULL,
  quarterly_target_mode ENUM('divide_equally','use_annual') NOT NULL DEFAULT 'divide_equally',
  variable1_name      VARCHAR(255) NULL,                  -- copied KPI-variable definitions (leaf entry)
  variable1_unit      VARCHAR(50)  NULL,
  variable2_name      VARCHAR(255) NULL,
  variable2_unit      VARCHAR(50)  NULL,
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
--
-- Every write path also records the numerator/denominator it divided, in
-- variable1_value / variable2_value, and names itself in value_source. The pair
-- is only re-derivable through kpiValueFromVariables() (lib/kpi/progress.ts)
-- when value_source = 'manual' — see the roll-up semantics in
-- lib/kpi/performance.ts#rollupParts, which are driven by calculation_type
-- rather than by the unit.
CREATE TABLE perf_kpi_quarter_progress (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  perf_kpi_id    BIGINT UNSIGNED NOT NULL,
  year_no        TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  quarter_no     TINYINT UNSIGNED NOT NULL CHECK (quarter_no BETWEEN 1 AND 4),
  progress_value DECIMAL(14,4) NULL,                       -- accumulated current value (computed from variables for leaf KPIs)
  variable1_value DECIMAL(14,4) NULL,                      -- Variable 1 (Dividend/numerator) behind progress_value
  variable2_value DECIMAL(14,4) NULL,                      -- Variable 2 (Divisor/denominator); NULL when the source had none
  is_computed    BOOLEAN NOT NULL DEFAULT 0,               -- 1 => derived from metrics, not entered
  value_source   ENUM('manual','rollup','data_source') NOT NULL DEFAULT 'manual', -- which engine wrote the row
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
-- Metrics are entered directly (leaf level), each with its Issue section, OR fed
-- from a data source (is_computed = 1, see LAYER D decision D3).
--
-- Deliberately NO value_source column, unlike perf_kpi_quarter_progress: that
-- table has three writers (manual PUT, parent roll-up, feed) which is_computed
-- alone cannot tell apart. A metric is a leaf with only two, so is_computed
-- already says which one wrote the row.
CREATE TABLE perf_metric_quarter_progress (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  perf_metric_id BIGINT UNSIGNED NOT NULL,
  year_no        TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  quarter_no     TINYINT UNSIGNED NOT NULL CHECK (quarter_no BETWEEN 1 AND 4),
  progress_value DECIMAL(14,4) NULL,
  variable1_value DECIMAL(14,4) NULL,                  -- numerator the feed divided; NULL on a hand-entered row
  variable2_value DECIMAL(14,4) NULL,                  -- denominator; NULL when the aggregation had none
  is_computed    TINYINT(1) NOT NULL DEFAULT 0,        -- 1 = written by the data-source feed
  issue          TEXT NULL,
  solution       TEXT NULL,
  recorded_by    VARCHAR(255) NULL,
  recorded_at    TIMESTAMP NULL,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pmet_period (perf_metric_id, year_no, quarter_no),
  CONSTRAINT fk_pmetqp FOREIGN KEY (perf_metric_id) REFERENCES perf_metric(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ##############   LAYER C — APPROVAL WORKFLOW (per KPI per quarter)   #########

-- ── perf_kpi_approval ────────────────────────────────────────────────────────
-- One approval record per (perf_kpi, year, quarter). It governs the KPI AND its
-- child metrics for that quarter as a single unit (decision: a committee owns a
-- KPI via perf_kpi.committee_id, so the KPI+metrics move through review together).
-- Stage chain: draft -> submitted -> forwarded -> approved (LOCKED); 'returned' is
-- a send-back state. Actors are resolved from committee_memberships.position for
-- perf_kpi.committee_id (Committee/Committee and Secretary = member, Committee Lead
-- = lead, Counselor = counselor). A missing row is treated by the app as 'draft'.
CREATE TABLE perf_kpi_approval (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  perf_kpi_id    BIGINT UNSIGNED NOT NULL,
  record_id      BIGINT UNSIGNED NOT NULL,          -- denormalized for record-scoped queries
  committee_id   VARCHAR(30) NULL,                  -- denormalized from perf_kpi for scoping
  year_no        TINYINT UNSIGNED NOT NULL CHECK (year_no BETWEEN 1 AND 5),
  quarter_no     TINYINT UNSIGNED NOT NULL CHECK (quarter_no BETWEEN 1 AND 4),
  state          ENUM('draft','submitted','returned','forwarded','approved') NOT NULL DEFAULT 'draft',
  submitted_by   VARCHAR(20)  NULL, submitted_at TIMESTAMP NULL,   -- faculty ids
  forwarded_by   VARCHAR(20)  NULL, forwarded_at TIMESTAMP NULL,
  approved_by    VARCHAR(20)  NULL, approved_at TIMESTAMP NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pkpi_approval (perf_kpi_id, year_no, quarter_no),
  CONSTRAINT fk_pka_kpi    FOREIGN KEY (perf_kpi_id) REFERENCES perf_kpi(id)          ON DELETE CASCADE,
  CONSTRAINT fk_pka_record FOREIGN KEY (record_id)   REFERENCES performance_record(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pka_record ON perf_kpi_approval(record_id, year_no, quarter_no);

-- ── perf_kpi_approval_event ──────────────────────────────────────────────────
-- Append-only audit trail + comment thread for a KPI approval. Every transition
-- writes one row; send-back / reject rows carry the reviewer's comment.
CREATE TABLE perf_kpi_approval_event (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  approval_id   BIGINT UNSIGNED NOT NULL,
  actor_id      VARCHAR(40)  NULL,            -- faculty id (or app user id for admin)
  actor_name    VARCHAR(255) NULL,
  actor_role    VARCHAR(40)  NULL,            -- 'member' | 'lead' | 'counselor' | 'admin'
  action        VARCHAR(40)  NOT NULL,        -- 'submit'|'return'|'forward'|'approve'|'reject'|'reverse'
  from_state    VARCHAR(20)  NULL,
  to_state      VARCHAR(20)  NOT NULL,
  comment       TEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pkae_appr FOREIGN KEY (approval_id) REFERENCES perf_kpi_approval(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pkae_appr ON perf_kpi_approval_event(approval_id, created_at);

-- ##############   LAYER D — DATA SOURCES (committee raw data)   ###############
--
--  A data source is a committee-owned, schema-defined table of RAW data — the
--  evidence behind a KPI number. The admin defines the source and its columns;
--  members of the owning committee record rows against those columns.
--
--  Decisions locked with the product owner (2026-07-18):
--    D1. Columns are per-source and user-defined (data_source_column); row values
--        are stored as a JSON object keyed by data_source_column.col_key. This
--        avoids a table-per-source or a wide EAV join for what is low-volume,
--        display-oriented data.
--    D2. Rows carry calendar year + optional quarter and are INDEPENDENT of any
--        performance_record, so raw data survives across 5-year cycles.
--    D3. Links FEED VALUES (implemented; superseded the phase-1 "evidence only"
--        rule). data_source_link.mappings says which rows count and how they
--        aggregate; lib/kpi/dataSourceFeed.ts writes the result into
--        perf_*_quarter_progress. The old reserved column_key / variable_slot /
--        aggregation columns were dropped in favour of the JSON — they could not
--        express filters or two mappings, and "column_key" was ambiguous between
--        "supplies the value" and "is filtered on".
--    D4. A link targets EXACTLY ONE of library_kpi / library_metric. Enforced by
--        the CHECK below plus the generated `target_key` used for uniqueness
--        (a plain UNIQUE over nullable columns would not catch duplicates,
--        because MySQL treats NULLs as distinct in unique indexes).
--    D5. A fed quarter value is CUMULATIVE WITHIN ITS YEAR: Q3 aggregates matching
--        rows from Q1..Q3 of that year, matching progress_value's existing meaning
--        and quarterTargetFor's annual*q/4. The window resets each year.
--        Annual-grain sources have quarter IS NULL; those rows count from Q1 of
--        their year, since the figure describes the whole year.
--
--  Note: library_kpi.data_source_url (a free-text link) predates this layer and
--  remains as an informal pointer; data_source is the structured replacement.

-- ── data_source ──────────────────────────────────────────────────────────────
-- One row per committee-owned raw-data table.
CREATE TABLE data_source (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  description   VARCHAR(1000) NULL,
  committee_id  VARCHAR(30)  NOT NULL,                 -- FK -> committees.id (owning committee)
  period_grain  ENUM('quarterly','annual') NOT NULL DEFAULT 'quarterly',
                                                       -- quarterly: entries carry year + quarter 1..4
                                                       -- annual:    entries carry year, quarter IS NULL
  status        ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_by    VARCHAR(20)  NULL,                     -- FK -> faculty.id
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ds_committee FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ds_creator   FOREIGN KEY (created_by)   REFERENCES faculty(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_ds_committee ON data_source(committee_id, status);

-- ── data_source_column ───────────────────────────────────────────────────────
-- The user-defined schema of one data source. col_key is the stable slug used
-- as the key inside data_source_entry.values_json; label is what the UI shows.
CREATE TABLE data_source_column (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  data_source_id BIGINT UNSIGNED NOT NULL,
  col_key        VARCHAR(40)  NOT NULL,                -- slug, e.g. "student_count"
  label          VARCHAR(255) NOT NULL,
  data_type      ENUM('text','url','number','date','select','boolean',
                      'faculty','program','curriculum') NOT NULL DEFAULT 'text',
                                                       -- faculty: stores a faculty.id ("fac-001")
                                                       -- program: stores a PROGRAMS abbr ("PH")
                                                       -- curriculum: stores a CURRICULUMS abbr ("PHB")
  unit           VARCHAR(50)  NULL,                    -- free text, same convention as library_kpi.unit
  options        JSON NULL,                            -- string[] of allowed values; only for data_type='select'.
                                                       -- NULL for faculty/program/curriculum: their options are DERIVED
                                                       -- (roster / shared catalog), never authored or stored.
  is_required    TINYINT(1) NOT NULL DEFAULT 0,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ds_col (data_source_id, col_key),
  CONSTRAINT fk_dsc_source FOREIGN KEY (data_source_id) REFERENCES data_source(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_dsc_sort ON data_source_column(data_source_id, sort_order);

-- ── data_source_entry ────────────────────────────────────────────────────────
-- One recorded row of raw data. values_json is an object keyed by col_key;
-- the API validates it against data_source_column before writing (decision D1).
-- ("values" is a reserved word in MySQL, hence values_json.)
CREATE TABLE data_source_entry (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  data_source_id BIGINT UNSIGNED NOT NULL,
  year           SMALLINT NOT NULL,                    -- Buddhist-era calendar year, e.g. 2568
  quarter        TINYINT UNSIGNED NULL CHECK (quarter IS NULL OR quarter BETWEEN 1 AND 4),
                                                       -- NULL iff the source's period_grain = 'annual'
  values_json    JSON NOT NULL,
  note           TEXT NULL,
  recorded_by    VARCHAR(20) NULL,                     -- FK -> faculty.id
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dse_source   FOREIGN KEY (data_source_id) REFERENCES data_source(id) ON DELETE CASCADE,
  CONSTRAINT fk_dse_recorder FOREIGN KEY (recorded_by)    REFERENCES faculty(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_dse_period ON data_source_entry(data_source_id, year, quarter);

-- ── data_source_link ─────────────────────────────────────────────────────────
-- Feed edge: "these rows of this data source produce that KPI's / metric's value".
-- Exactly one of library_kpi_id / library_metric_id is set (decision D4).
CREATE TABLE data_source_link (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  data_source_id    BIGINT UNSIGNED NOT NULL,
  library_kpi_id    BIGINT UNSIGNED NULL,
  library_metric_id BIGINT UNSIGNED NULL,
  -- How the matching rows become a number (decision D5). A single-element array:
  --   [{ aggregation, columnKey, filters: [{ field, operator, value, valueTo }] }]
  -- field: a data_source_column.col_key, or '__period' for the entry's own year/quarter
  -- A percent/ratio target uses aggregation 'percent_of' / 'ratio_of', which carries
  -- both sides of the fraction; the feed stores its numerator/denominator in the
  -- target's variable1_value / variable2_value. Rows written before that consolidation
  -- also carried a 'slot' key — see scripts/migrate-link-value-slots.mjs.
  -- Validated by validateMappings() in lib/kpi/dataSourceFilters.ts before write.
  mappings          JSON NULL,
  note              VARCHAR(1000) NULL,
  -- Stable non-null discriminator so uniqueness actually holds (decision D4).
  target_key        VARCHAR(32) AS (CONCAT(IF(library_kpi_id IS NULL, 'm', 'k'),
                                           COALESCE(library_kpi_id, library_metric_id))) STORED,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ds_link (data_source_id, target_key),
  CONSTRAINT chk_dsl_one_target CHECK ((library_kpi_id IS NULL) <> (library_metric_id IS NULL)),
  CONSTRAINT fk_dsl_source FOREIGN KEY (data_source_id)    REFERENCES data_source(id)    ON DELETE CASCADE,
  CONSTRAINT fk_dsl_kpi    FOREIGN KEY (library_kpi_id)    REFERENCES library_kpi(id)    ON DELETE CASCADE,
  CONSTRAINT fk_dsl_metric FOREIGN KEY (library_metric_id) REFERENCES library_metric(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_dsl_kpi    ON data_source_link(library_kpi_id);
CREATE INDEX idx_dsl_metric ON data_source_link(library_metric_id);

-- =============================================================================
--  NOTES / rules enforced in the application layer (not by DDL)
--  Existing database migration for target inheritance mode:
--    ALTER TABLE library_metric
--      ADD COLUMN target_mode ENUM('none','inherit_parent','manual')
--      NOT NULL DEFAULT 'manual' AFTER five_year_target;
--  * five_year_target is a PER-YEAR CAP (decision #5): on save of any
--    library_*_annual_target / perf_*_annual_target, enforce each single year
--    target <= five_year_target. The sum of annual targets may exceed it.
--    (A CHECK can't compare annual target rows with parent target rows.)
--  * custom_formula KPIs (decision #7): when calculation_type='custom_formula',
--    formula_id must be set. The formula RECORDS how the KPI is calculated; it is
--    NOT evaluated. rollupParts (lib/kpi/performance.ts) returns nulls for this
--    type, and no mathjs evaluation exists anywhere in the app despite the
--    dependency being present — a custom_formula KPI's quarterly value stays
--    blank until someone enters it. The other calculation types ignore
--    formula_id entirely.
--  * percent_of_total: pooled percentage roll-up,
--    SUM(child progress) / SUM(child quarter target) * 100. A child with no
--    progress value or no usable target is excluded from BOTH sums. This
--    replaced an older implicit rule that rolled up any unit='Percent' KPI as
--    the unweighted mean of each child's own progress percentage.
--  * ratio_of_total: the same pooled roll-up without the * 100, i.e.
--    SUM(child progress) / SUM(child quarter target). Same both-sides-usable
--    exclusion rule. Unlike percent_of_total this was NOT backfilled onto
--    existing unit='Ratio' KPIs — they were never on the old implicit percent
--    path, so flipping them would change results rather than preserve them.
--  * combined_percent / combined_ratio: pooled roll-up over what the CHILDREN
--    themselves divided —
--      SUM(child variable1_value) / SUM(child variable2_value)  [* 100]
--    with the same both-sides-usable exclusion, and no sum fallback (without
--    denominators there is no rate to report).
--    Which pooled family a KPI wants depends on the shape of its children, not
--    on its own unit:
--      children are COUNTS on their targets' scale  -> *_of_total
--        e.g. "admitted vs target": 329 admitted / 315 planned = 104%.
--      children are themselves FRACTIONS            -> combined_*
--        e.g. "% employed": pooling 4 curriculum percentages against 4 target
--        percentages gave 109%; the true rate is 109 employed / 143 grads = 76%.
--    A fed child carries variable2_value only when its own aggregation was a
--    fraction (percent_of / ratio_of in lib/kpi/dataSourceFilters.ts), so its
--    presence is what distinguishes the two cases in practice. Existing KPIs are
--    NOT auto-flipped; candidates are reported by
--      node --env-file=.env.local scripts/migrate-kpi-combined-types.mjs
--    and stamped only with --apply.
--  * Metric thresholds (decision #6): threshold_green/amber now exist on
--    library_metric & perf_metric — drive the metric's current-value bar the
--    same way KPI thresholds drive the KPI bar.
--  * Accumulated quarter target = running sum of (year_target / 4) across
--    Q1..Q4; computed on read, not stored.
--  * Roll-up for has_children KPIs uses calculation_type + calculation_logic
--    over child perf_metric quarter values; result written to
--    perf_kpi_quarter_progress.progress_value with is_computed = 1 and
--    value_source = 'rollup', alongside the numerator/denominator it divided in
--    variable1_value / variable2_value (lib/kpi/performance.ts#rollupParts).
--    PRECEDENCE: link > roll-up > manual. A data_source_link on the KPI (with
--    mappings) wins over the roll-up however many metrics the KPI has — the link
--    is the more specific statement, and expresses divisors no calculation_type
--    reaches (a faculty headcount) and numerators the children don't share.
--    See lib/kpi/performance.ts#rollsUpFromChildren.
--  * value_source names the engine that wrote a quarter row: 'manual' (the
--    progress PUT routes), 'rollup' (the calc engine above) or 'data_source'
--    (lib/kpi/dataSourceFeed.ts). is_computed stays as-is for existing callers,
--    but it cannot tell 'rollup' and 'data_source' apart — use value_source.
--    Existing databases are upgraded by
--      node --env-file=.env.local scripts/migrate-kpi-value-source.mjs
--  * Full re-sync (decision #4): match perf rows to library rows by
--    source_kpi_id / source_metric_id; INSERT new, UPDATE definitions + targets,
--    and soft-handle library rows deleted after activation (recommend a
--    `retired_at` column rather than hard delete if progress exists).
--  * Approval lock (perf_kpi_approval, LAYER C): when a KPI's approval row for a
--    (year, quarter) is state='approved', the quarter progress for that KPI and
--    ALL its metrics is locked — the progress PUT routes reject writes with 409
--    unless an admin first reverses the approval to a pre-approval state.
--  * Transition legality is enforced in lib/kpi/approvalWorkflow.ts (state machine
--    + position->stage mapping); the POST /api/perf-kpis/:id/approval route is the
--    single writer of perf_kpi_approval / perf_kpi_approval_event.
--  * Data sources (LAYER D): existing databases are upgraded by
--      node --env-file=.env.local scripts/migrate-data-sources.mjs
--    (idempotent; creates data_source, data_source_column, data_source_entry,
--    data_source_link).
--  * data_source_entry.values_json is validated in the application layer against
--    that source's data_source_column rows (lib/kpi/dataSources.ts): unknown keys
--    rejected, required columns present, number/date/select values coercible.
--    No DDL can express this — the column set is per-row data, not schema.
--  * data_source_entry.quarter must be NULL when the source's period_grain is
--    'annual' and 1..4 when it is 'quarterly'. The CHECK only bounds the range;
--    the NULL-vs-not rule is app-enforced because it depends on the parent row.
--  * The data-source FEED (decision D3/D5, lib/kpi/dataSourceFeed.ts) writes
--    perf_*_quarter_progress.progress_value with is_computed = 1. Like the metric
--    roll-up it bypasses the HTTP routes (which demand issue+solution) and never
--    touches issue / solution / recorded_by, so a human's narrative survives.
--    UNLIKE the roll-up it RESPECTS the guards: a closed recording period or an
--    approval-locked quarter (submitted/forwarded/approved) is skipped and
--    reported, never overwritten.
--  * Derived-option column types ('faculty','program','curriculum'): allowed values are NOT in
--    data_source_column.options (it stays NULL). resolveColumnOptions() in
--    lib/kpi/dataSourcesServer.ts fills them from the faculty roster / shared catalogs
--    before each entry write, so the stored id or code is validated but there is
--    no FK — deleting a faculty row will NOT cascade into values_json. Display
--    falls back to the raw id when a lookup misses, by design.
-- =============================================================================
