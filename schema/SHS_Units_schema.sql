-- =============================================================================
--  SHS Units table — MySQL / MariaDB schema
--  Admin-managed reference list of measurement units for KPIs and metrics.
--  Target DB: shs_kpis_claude @ 127.0.0.1:3306 (XAMPP MariaDB), same database
--  as the faculty/committee/category tables.
--
--  Grain: one row per unit. Numeric surrogate PK (nothing references a unit by
--  id yet — KPI/metric `unit` columns remain free-text for now), so unlike
--  kpi_categories this uses BIGINT AUTO_INCREMENT rather than a slug.
--
--  Conventions: snake_case, created_at/updated_at on every table, utf8mb4 for
--  Thai text. English name is unique to prevent duplicate entries.
-- =============================================================================

SET NAMES utf8mb4;

-- ── units ────────────────────────────────────────────────────────────────────
CREATE TABLE units (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  unit_name_th  VARCHAR(100) NOT NULL,                 -- Thai name, e.g. "ร้อยละ"
  unit_name_en  VARCHAR(100) NOT NULL,                 -- English name, e.g. "Percent"
  description   VARCHAR(500) NULL,                      -- optional blurb
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_units_en (unit_name_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Seed data (common measurement units) ─────────────────────────────────────
INSERT INTO units (unit_name_th, unit_name_en, description) VALUES
  ('ร้อยละ',       'Percent',  'Percentage value (%).'),
  ('คะแนน',        'Score',    'Score on a defined scale.'),
  ('อัตราส่วน',     'Ratio',    'Ratio between two quantities.'),
  ('จำนวน',        'Count',    'A simple count of items.'),
  ('คน',           'Persons',  'Number of people.'),
  ('บาท',          'Baht',     'Thai Baht (THB).');
