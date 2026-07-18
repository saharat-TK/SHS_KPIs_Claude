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
--  Scoped per strategic set: each set owns its own categories (set_id). `id`
--  stays a globally-unique slug (so KPI/metric FKs and the reorder/[id] routes
--  need no structural change). A NULL set_id row is a legacy/global category.
CREATE TABLE kpi_categories (
  id          VARCHAR(40)  PRIMARY KEY,             -- stable, globally-unique slug
  set_id      BIGINT UNSIGNED NULL,                 -- owning strategic set (NULL = legacy/global)
  name        VARCHAR(255) NOT NULL,                -- display label, e.g. "Student Success"
  description VARCHAR(500) NULL,                     -- optional blurb shown in the manage modal
  sort_order  INT          NOT NULL DEFAULT 0,       -- controls left-to-right tab order (per set)
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_kpi_categories_set FOREIGN KEY (set_id)
    REFERENCES strategic_set(id) ON DELETE CASCADE
);

CREATE INDEX idx_kpi_categories_set_sort ON kpi_categories(set_id, sort_order);

-- No static seed: each strategic set seeds its own default categories when it is
-- created (see app/api/strategic-sets/route.ts — seedDefaultCategories / clone).
