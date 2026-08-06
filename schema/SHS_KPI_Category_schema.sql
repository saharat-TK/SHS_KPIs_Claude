-- =============================================================================
--  SHS KPI Categories + KPI Types — MySQL / MariaDB schema
--  Source: lib/types.ts (KPI_CATEGORIES / KPI_TYPES consts) — both promoted from
--  hardcoded union types to user-managed, DB-backed tables.
--  Target DB: shs_kpis_claude @ 127.0.0.1:3306 (XAMPP MariaDB), same database
--  as the faculty/committee tables (schema/SHS_Faculty_Committee_schema.sql).
--
--  Grain: one row per KPI type; one row per KPI category (per strategic set).
--
--  Notes:
--    - Category `id` is a stable slug (e.g. "student_success") generated from
--      the name on create. The app references KPIs by this id, so it never
--      changes on a rename — only `name`/`description`/`sort_order`/`kpi_type`
--      are editable.
--    - library_kpi.category_id / .routine_category_id and library_metric.category_id
--      DO have FKs onto this table (ON DELETE SET NULL). The "block delete while a
--      category is in use" rule is a UI affordance on top of that, not the
--      constraint itself.
--
--  Conventions: snake_case, natural string PK matching the app's id format,
--  created_at/updated_at on every table.
-- =============================================================================

SET NAMES utf8mb4;

-- ── kpi_type ─────────────────────────────────────────────────────────────────
--  Reference list backing the "KPI Type" dropdown and the category taxonomy
--  split. The PK is the slug the app has always stored (`strategic` etc.), so
--  library_kpi.kpi_type / perf_kpi.kpi_type became FKs onto this table without
--  rewriting a single row.
--
--  `applies_to_categories` marks the types a CATEGORY may be classified as.
--  Categories split two ways only — Strategic and Routine — while a KPI may
--  additionally be Operational. Keeping that as a flag (rather than a hardcoded
--  list in the manage-categories modal) is the whole point of the promotion.
CREATE TABLE kpi_type (
  id                    VARCHAR(20)  PRIMARY KEY,           -- 'strategic' | 'operational' | 'routine'
  kpi_type_name         VARCHAR(50)  NOT NULL,              -- display label, e.g. "Strategic"
  sort_order            INT          NOT NULL DEFAULT 0,    -- dropdown / column-sort order
  applies_to_categories TINYINT(1)   NOT NULL DEFAULT 1,    -- may this type classify a category?
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO kpi_type (id, kpi_type_name, sort_order, applies_to_categories) VALUES
  ('strategic',   'Strategic',   1, 1),
  ('operational', 'Operational', 2, 0),
  ('routine',     'Routine',     3, 1);

-- ── kpi_categories ───────────────────────────────────────────────────────────
--  Scoped per strategic set: each set owns its own categories (set_id). `id`
--  stays a globally-unique slug (so KPI/metric FKs and the reorder/[id] routes
--  need no structural change). A NULL set_id row is a legacy/global category.
--
--  `kpi_type` splits the list into two independent taxonomies. Strategic
--  categories are what the category tab bars and the dashboard group by
--  (library_kpi.category_id); Routine categories are the school's ด้านที่ 1–7
--  operating areas, reached through library_kpi.routine_category_id.
CREATE TABLE kpi_categories (
  id          VARCHAR(40)  PRIMARY KEY,             -- stable, globally-unique slug
  set_id      BIGINT UNSIGNED NULL,                 -- owning strategic set (NULL = legacy/global)
  kpi_type    VARCHAR(20)  NOT NULL DEFAULT 'strategic',  -- which taxonomy this belongs to
  name        VARCHAR(255) NOT NULL,                -- display label, e.g. "Student Success"
  description VARCHAR(500) NULL,                     -- optional blurb shown in the manage modal
  sort_order  INT          NOT NULL DEFAULT 0,       -- controls left-to-right tab order (per set)
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_kpi_categories_set FOREIGN KEY (set_id)
    REFERENCES strategic_set(id) ON DELETE CASCADE,
  CONSTRAINT fk_kpi_categories_type FOREIGN KEY (kpi_type)
    REFERENCES kpi_type(id) ON DELETE RESTRICT
);

CREATE INDEX idx_kpi_categories_set_sort ON kpi_categories(set_id, sort_order);
CREATE INDEX idx_kpi_categories_type ON kpi_categories(set_id, kpi_type, sort_order);

-- No static seed: each strategic set seeds its own default categories when it is
-- created (see app/api/strategic-sets/route.ts — seedDefaultCategories / clone).
-- The seven Routine areas (ด้านที่ 1–7) were seeded for set 2 by
-- scripts/migrate-kpi-type-table.mjs.
