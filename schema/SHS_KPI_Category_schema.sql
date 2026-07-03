-- =============================================================================
--  SHS KPI Categories table — MySQL / MariaDB schema
--  Source: lib/types.ts (KPI_CATEGORIES const) — promoted from a hardcoded
--  union type to a user-managed, DB-backed table.
--  Target DB: shs_kpis_claude @ 127.0.0.1:3306 (XAMPP MariaDB), same database
--  as the faculty/committee tables (schema/SHS_Faculty_Committee_schema.sql).
--
--  Grain: one row per KPI category (5 seed rows mirroring the original const).
--
--  Notes:
--    - `id` is a stable slug (e.g. "student_success") generated from the name
--      on create. The app references KPIs by this id, so it never changes on a
--      rename — only `name`/`description`/`sort_order` are editable.
--    - No FK from KPIs to this table: KPIs still live in the in-memory seed
--      (lib/data/seed.ts), not MySQL. The "block delete while a category is in
--      use" rule is therefore enforced in the app against the in-memory KPIs,
--      not by a database constraint. Add an FK here once KPIs move to MySQL.
--
--  Conventions: snake_case, natural string PK matching the app's id format,
--  created_at/updated_at on every table.
-- =============================================================================

-- ── kpi_categories ───────────────────────────────────────────────────────────
CREATE TABLE kpi_categories (
  id          VARCHAR(40)  PRIMARY KEY,             -- stable slug, e.g. "student_success"
  name        VARCHAR(255) NOT NULL,                -- display label, e.g. "Student Success"
  description VARCHAR(500) NULL,                     -- optional blurb shown in the manage modal
  sort_order  INT          NOT NULL DEFAULT 0,       -- controls left-to-right tab order
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpi_categories_sort ON kpi_categories(sort_order);

-- ── Seed data (mirrors the original KPI_CATEGORIES const) ────────────────────
INSERT INTO kpi_categories (id, name, description, sort_order) VALUES
  ('student_success',       'Student Success',        'Graduation, licensure and post-grad outcomes.', 1),
  ('faculty_excellence',    'Faculty Excellence',     'Faculty qualifications and development.',        2),
  ('research_output',       'Research Output',        'Publications, grants and research productivity.', 3),
  ('operational_efficiency','Operational Efficiency', 'Ratios and resource utilisation.',               4),
  ('financial_health',      'Financial Health',       'Cost and financial sustainability measures.',    5);
