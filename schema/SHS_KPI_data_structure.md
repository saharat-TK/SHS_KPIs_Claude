# SHS KPI — Data Structure Analysis & Schema Design

Source file: `EX_2568_SHS_KPI.xlsx`, single sheet `2568_AllKPIsNoTotal`.

## 1. Shape of the source

- **2,228 data rows × 50 columns** (column 50 is empty padding).
- It is a fully **denormalized export** — one wide table, all Thai headers, fiscal year 2568 (2025) only.
- **Grain:** the primary key `YID` is unique across all 2,228 rows. The rows decompose exactly as **557 distinct KPIs (`SID`) × 4 quarters = 2,228**. Every `SID` has precisely 4 rows (one per quarter), so the natural grain is *KPI × quarter*.

## 2. The key structural finding

Profiling each column for "constant within an `SID`" vs "varies across the 4 quarters" gives a clean split:

| | Columns | Meaning |
|---|---|---|
| **Constant per KPI** (definition) | SID, indicator code, names, DataLevel, strategy, indicator type, routine plan/area, unit of measure, responsible unit, manager, chair, accountability, calc method, numerator/denominator labels, definition, data source/method/cycle, fiscal year | These belong in a **`kpi`** definition table — currently repeated 4× each. |
| **Varies per quarter** (measurement) | YID, KPI target, quarter, numerator/denominator values, result, AP%, achievement, data status, capture status, note/problem/solution/link, AP2 text, and the 6 audit fields (recorder + 2 confirmers, each with email + timestamp) | These belong in a **`kpi_record`** fact table. |

So the redundancy is large: ~30 definition columns are duplicated across 4 quarterly rows. Normalizing removes that.

## 3. Proposed schema (3 layers)

**Lookup tables** (low-cardinality, deduplicated):
`strategy` (7), `indicator_type` (4), `routine_plan` (12), `routine_area` (8), `responsible_unit` (14), `staff` (managers/chairs, ~9), `app_user` (audit-trail emails, ~18), `unit_of_measure` (15).

**`kpi`** — one row per `SID` (557 rows), holding every constant attribute plus foreign keys into the lookups.

**`kpi_record`** — one row per `YID` (2,228 rows), holding the quarterly values and the 3-stage approval audit, with a `UNIQUE (sid, fiscal_year, quarter_no)` constraint that enforces the grain.

Full DDL: see `SHS_KPI_schema.sql` (PostgreSQL — chosen to match the app's stated Phase-2 target of Postgres/Supabase in `lib/data/repositories.ts`).

## 4. Data-quality notes for the import (ETL)

- **Excel error strings** appear in numeric columns: `#DIV/0!` (achievement when denominator = 0), `#VALUE!`, `#REF!`. Coerce these to `NULL` when loading `target`, `result`, `ap_pct`, `numerator_value`, `denominator_value`.
- **Dates** are JS `toString()` text, e.g. `"Sun Mar 23 2025 19:31:29 GMT+0700 (Indochina Time)"`. Parse to `timestamptz` on import.
- **Sentinel "no value" strings**: `-ไม่มี-` and `ไม่มี-ใส่ค่าตัวหาร 1` mean "none / divisor forced to 1". Decide per column whether to store as `NULL` or keep literally.
- **Sparse columns**: `สถานะเปิดบันทึก` (col 23) is 95% null; the audit emails/dates are 50–74% null (records not yet recorded/confirmed) — expected for an in-progress year, all nullable.
- **`KPI` target varies by quarter** — confirm this is intentional (quarterly targets) rather than an export artifact; the schema treats it as a per-record value.
- **Two name columns** (`manager`, `chair`) are Thai names with no email; the audit-trail people are emails with no Thai name. They are modeled separately (`staff` vs `app_user`); link them later if a master person directory exists.

## 5. Column → table map (quick reference)

| Source col | → table.column |
|---|---|
| YID | kpi_record.yid |
| SID | kpi.sid / kpi_record.sid |
| ตัวชี้วัดที่ | kpi.indicator_code |
| ตัวชี้วัดตามแผนกลยุทธ์ | kpi.name_strategic |
| DataLevel | kpi.data_level |
| กลยุทธ์ที่ / หัวข้อกลยุทธ์ | → strategy |
| ประเภทตัวชี้วัด | → indicator_type |
| ฝ่ายงานรับผิดชอบ | → responsible_unit |
| ผู้บริหาร / ประธานฝ่าย | → staff |
| หน่วยนับตัวชี้วัด | → unit_of_measure |
| KPI (target) | kpi_record.target |
| ค่าตัวตั้ง / ค่าตัวหาร / ผลลัพธ์ / AP(%) | kpi_record.numerator_value / denominator_value / result / ap_pct |
| Check_Achievement | kpi_record.achievement |
| สถานะข้อมูล | kpi_record.data_status |
| อีเมล/วันที่ บันทึก·ยืนยัน1·ยืนยัน2 | kpi_record audit fields |
