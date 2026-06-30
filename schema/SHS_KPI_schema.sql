-- =============================================================================
--  SHS KPI System — PostgreSQL schema
--  Source: EX_2568_SHS_KPI.xlsx  (sheet "2568_AllKPIsNoTotal")
--  Grain of source export: 557 KPI definitions × 4 quarters = 2,228 rows
--
--  Design: the flat export is split into
--    (1) lookup/dimension tables   — low-cardinality, reusable values
--    (2) kpi                        — one row per KPI definition  (key = SID)
--    (3) kpi_record                — one row per KPI per quarter  (key = YID)
--
--  Conventions: snake_case, surrogate PKs where the source key is opaque,
--  natural codes kept as business keys, all timestamps timestamptz,
--  Thai source column shown in -- comments for traceability.
-- =============================================================================

BEGIN;

-- ── Reference / lookup tables ───────────────────────────────────────────────

-- กลยุทธ์ (col 12-13). 7 strategies.
CREATE TABLE strategy (
    strategy_no   SMALLINT PRIMARY KEY,          -- กลยุทธ์ที่
    title         TEXT NOT NULL                  -- หัวข้อกลยุทธ์ (code-prefixed)
);

-- ประเภทตัวชี้วัด (col 14). 4 fixed types.
CREATE TABLE indicator_type (
    code          SMALLINT PRIMARY KEY,          -- leading number, e.g. 1..4
    label         TEXT NOT NULL                  -- full Thai label
);

-- หัวข้อด้านงานประจำ (col 8-9). 8 routine-work areas.
CREATE TABLE routine_area (
    area_no       SMALLINT PRIMARY KEY,          -- งานประจำด้านที่
    title         TEXT NOT NULL                  -- หัวข้อด้านงานประจำ
);

-- แผนปฏิบัติการงานประจำหลัก (col 6-7). 12 routine action plans.
CREATE TABLE routine_plan (
    plan_no       SMALLINT PRIMARY KEY,          -- แผนปฏิบัติการงานประจำหลักที่
    title         TEXT NOT NULL                  -- แผนปฏิบัติการงานประจำหลัก
);

-- ฝ่ายงานรับผิดชอบ (col 17). 14 responsible units/committees.
CREATE TABLE responsible_unit (
    unit_id       SERIAL PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE           -- ฝ่ายงานรับผิดชอบ
);

-- ชื่อผู้บริหาร / ชื่อประธานฝ่าย (col 18-19). People named on the KPI.
CREATE TABLE staff (
    staff_id      SERIAL PRIMARY KEY,
    full_name     TEXT NOT NULL UNIQUE           -- Thai name
);

-- App users referenced in the audit trail (col 32,34,36 — emails).
CREATE TABLE app_user (
    email         TEXT PRIMARY KEY               -- *@mfu.ac.th
);

-- หน่วยนับตัวชี้วัด (col 10). 15 units (ร้อยละ, จำนวน, ...).
CREATE TABLE unit_of_measure (
    uom_id        SERIAL PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE
);

-- ── Core: KPI definition (constant per SID) ─────────────────────────────────
CREATE TABLE kpi (
    sid               TEXT PRIMARY KEY,          -- SID  (col 1, e.g. "S100")
    indicator_code    TEXT NOT NULL,             -- ตัวชี้วัดที่ (col 2, e.g. "1.110")
    name_strategic    TEXT NOT NULL,             -- ตัวชี้วัดตามแผนกลยุทธ์ (col 3)
    name_group        TEXT,                      -- กลุ่มหลักตัวชี้วัดตามแผนกลยุทธ์ (col 4)
    data_level        SMALLINT NOT NULL,         -- DataLevel (col 5) 1..3

    strategy_no       SMALLINT REFERENCES strategy(strategy_no),       -- col 12
    indicator_type    SMALLINT REFERENCES indicator_type(code),        -- col 14
    routine_plan_no   SMALLINT REFERENCES routine_plan(plan_no),       -- col 6
    routine_area_no   SMALLINT REFERENCES routine_area(area_no),       -- col 8
    responsible_unit  INT REFERENCES responsible_unit(unit_id),        -- col 17
    manager_id        INT REFERENCES staff(staff_id),                  -- col 18 ผู้บริหาร
    chair_id          INT REFERENCES staff(staff_id),                  -- col 19 ประธานฝ่าย
    uom_id            INT REFERENCES unit_of_measure(uom_id),          -- col 10

    accountability    TEXT NOT NULL,             -- คำรับรองการปฏิบัติงาน (col 15) มหาวิทยาลัย|สำนักวิชาฯ
    calc_method       TEXT,                      -- การคำนวณตัวชี้วัด (col 16)
    numerator_label   TEXT,                      -- หน่วยตัวตั้ง (col 24)
    denominator_label TEXT,                      -- หน่วยตัวหาร (col 26)

    definition        TEXT,                      -- นิยามตัวชี้วัด (col 43)
    data_source       TEXT,                      -- ที่มาของข้อมูล (col 44)
    collection_method TEXT,                      -- วิธีการเก็บข้อมูล (col 45)
    collection_cycle  TEXT,                      -- วงรอบในการเก็บข้อมูล (col 46)
    fiscal_year       SMALLINT NOT NULL          -- ปีงบประมาณ (col 20) e.g. 2568
);

CREATE INDEX idx_kpi_strategy   ON kpi(strategy_no);
CREATE INDEX idx_kpi_unit       ON kpi(responsible_unit);
CREATE INDEX idx_kpi_type       ON kpi(indicator_type);

-- ── Fact: one measurement record per KPI per quarter (key = YID) ────────────
CREATE TABLE kpi_record (
    yid               TEXT PRIMARY KEY,          -- YID (col 0, e.g. "Y680739")
    sid               TEXT NOT NULL REFERENCES kpi(sid),
    fiscal_year       SMALLINT NOT NULL,         -- ปีงบประมาณ
    quarter_no        SMALLINT NOT NULL          -- ไตรมาสที่ (col 22) 1..4
                      CHECK (quarter_no BETWEEN 1 AND 4),

    -- targets & values (numeric; coerce Excel errors like #DIV/0! / #VALUE! to NULL on import)
    target            NUMERIC,                   -- KPI (col 11) — varies by quarter
    numerator_value   NUMERIC,                   -- ค่าผลการดำเนินงาน/ค่าตัวตั้ง (col 25)
    denominator_value NUMERIC,                   -- ค่าตัวหาร (col 27)
    result            NUMERIC,                   -- ผลลัพธ์ (col 28)
    ap_pct            NUMERIC,                   -- AP (%) (col 29) achievement-vs-target ratio

    achievement       TEXT,                      -- Check_Achievement (col 30) Achieved|Not Achieved|NULL(#DIV/0!)
    data_status       TEXT,                      -- สถานะข้อมูล (col 31) workflow state
    record_open_state TEXT,                      -- สถานะเปิดบันทึก (col 23) close|NULL
    quarter_capture   TEXT,                      -- สถานะการบันทึกข้อมูลไตรมาส (col 38)

    note              TEXT,                      -- หมายเหตุ (col 39)
    problem           TEXT,                      -- ปัญหา (col 40)
    solution          TEXT,                      -- แนวทางแก้ไข (col 41)
    link              TEXT,                      -- Link (col 42)
    ap2_explain       TEXT,                      -- อธิบายAP2 (col 47)
    ap2_explain_short TEXT,                      -- อธิบายAP2สั้น (col 48)

    -- 3-stage approval audit trail (cols 32-37)
    recorded_by       TEXT REFERENCES app_user(email),  -- อีเมลผู้บันทึกข้อมูล
    recorded_at       TIMESTAMPTZ,                       -- วันที่บันทึกข้อมูล
    confirm1_by       TEXT REFERENCES app_user(email),  -- ผู้ยืนยันขั้น1
    confirm1_at       TIMESTAMPTZ,
    confirm2_by       TEXT REFERENCES app_user(email),  -- ผู้ยืนยันขั้น2
    confirm2_at       TIMESTAMPTZ,

    UNIQUE (sid, fiscal_year, quarter_no)        -- enforce the natural grain
);

CREATE INDEX idx_record_sid        ON kpi_record(sid);
CREATE INDEX idx_record_period     ON kpi_record(fiscal_year, quarter_no);
CREATE INDEX idx_record_status     ON kpi_record(data_status);
CREATE INDEX idx_record_achievement ON kpi_record(achievement);

COMMIT;
