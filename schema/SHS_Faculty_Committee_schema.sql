-- =============================================================================
--  SHS Faculty & Committee tables — MySQL / MariaDB schema
--  Source: lib/types.ts (Committee, FacultyMember) + lib/data/seed.ts mock data
--  Verified live against: shs_kpis_claude @ 127.0.0.1:3306 (XAMPP MariaDB 10.4.28)
--
--  Grain:
--    committees            — one row per standing committee (17 rows in seed data)
--    faculty                — one row per faculty member, person-level attributes only
--    committee_memberships — one row per (faculty, committee) pairing — the
--                             many-to-many bridge: a faculty member can sit on
--                             multiple committees, and a committee has many members
--
--  Relationships:
--    committee_memberships.faculty_id    -> faculty.id     (CASCADE)
--    committee_memberships.committee_id  -> committees.id  (CASCADE)
--    committees.head_id                  -> faculty.id     (optional; the
--                                            faculty member leading the
--                                            committee; SET NULL on delete)
--
--  committee_id/position/kpi_focus previously lived directly on `faculty` when
--  the relationship was modeled one-to-many; they've moved to
--  `committee_memberships` since position and kpi_focus are properties of a
--  specific membership (a person can be "Committee Lead" on one committee and
--  just "Committee" on another), not the person globally. research_score has
--  been dropped from the schema entirely (not migrated anywhere).
--
--  Load order: `committees` and `faculty` don't reference each other directly
--  at CREATE time (committees.head_id FK is added after `faculty` exists to
--  break the cycle), then `committee_memberships` last since it depends on both.
--
--  Note on backend choice: lib/data/repositories.ts's Phase-2 comment names
--  Firebase/Supabase/Postgres as the intended target; this schema is MySQL
--  because that's the database actually available locally (XAMPP). Adjust
--  dialect (ENUM syntax, AUTO_INCREMENT, etc.) if the project moves to Postgres.
--
--  Conventions: snake_case, natural string PKs matching the app's existing
--  id format ("cmt-*", "fac-*"), created_at/updated_at on every table.
-- =============================================================================

-- ── committees ───────────────────────────────────────────────────────────────
-- Mirrors the `Committee` TS interface (lib/types.ts).
CREATE TABLE committees (
  id          VARCHAR(30)  PRIMARY KEY,             -- e.g. "cmt-curriculum"
  name        VARCHAR(255) NOT NULL,                -- e.g. "Curriculum and Teaching Committee"
  faculty     VARCHAR(255) NOT NULL,                -- parent faculty/school name, e.g. "School of Health Science"
  status      ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
  head_id     VARCHAR(20)  NULL,                    -- FK -> faculty.id, added below (nullable: not every committee has a lead yet)
  key_metric  VARCHAR(255) NOT NULL,                -- e.g. "Curriculum Quality"
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── faculty ──────────────────────────────────────────────────────────────────
-- Person-level attributes only. `rank` is a credential, not committee-specific.
CREATE TABLE faculty (
  id          VARCHAR(20)  PRIMARY KEY,              -- e.g. "fac-001"
  name        VARCHAR(255) NOT NULL,
  `rank`      ENUM('Professor','Associate Professor','Assistant Professor','Lecturer','Support Staff') NOT NULL,
  email       VARCHAR(255) NULL,                     -- not populated by app seed data yet
  name_TH     VARCHAR(255) NULL,                     -- Thai-script name, not populated by app seed data yet
  program     ENUM('BioMed','EnvH','OHS','PH','Sport Science','SHS Office') NOT NULL,
  status      ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
  system_role ENUM('admin','user') NOT NULL DEFAULT 'user', -- app access level, not populated by app seed data yet
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── committee_memberships ────────────────────────────────────────────────────
-- The faculty <-> committee bridge. position/kpi_focus are per-membership:
-- the same faculty member can hold a different position and focus on each
-- committee they sit on. The PK is (faculty_id, committee_id) — one row per
-- person per committee — so a person holding both Counselor and Committee
-- Lead on the same committee is represented by the single combined position
-- value below (scripts/migrate-committee-counselor-lead-position.mjs), not by
-- two rows.
CREATE TABLE committee_memberships (
  faculty_id    VARCHAR(20)  NOT NULL,               -- FK -> faculty.id, added below
  committee_id  VARCHAR(30)  NOT NULL,                -- FK -> committees.id, added below
  position      ENUM('Counselor','Committee Lead','Committee','Committee and Secretary','Counselor and Committee Lead') NOT NULL,
  kpi_focus     VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (faculty_id, committee_id)             -- one row per person+committee pair
);

-- ── Foreign keys (added after all three tables exist) ───────────────────────
ALTER TABLE committees
  ADD CONSTRAINT fk_committee_head
  FOREIGN KEY (head_id) REFERENCES faculty(id) ON DELETE SET NULL;

ALTER TABLE committee_memberships
  ADD CONSTRAINT fk_membership_faculty
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE;

ALTER TABLE committee_memberships
  ADD CONSTRAINT fk_membership_committee
  FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE;

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- committee_memberships.faculty_id is already covered by the composite PK's
-- leading column; committee_id needs its own index for the reverse lookup
-- ("all members of committee X").
CREATE INDEX idx_membership_committee ON committee_memberships(committee_id);
CREATE INDEX idx_faculty_status       ON faculty(status);
CREATE INDEX idx_committee_status     ON committees(status);
