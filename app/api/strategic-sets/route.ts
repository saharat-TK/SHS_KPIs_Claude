import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

export const dynamic = "force-dynamic";

// end_year is a generated column — never selected/written by the client.
const SELECT_FIELDS = `
  s.id, s.name, s.description,
  s.start_year AS startYear, s.end_year AS endYear, s.status,
  s.cloned_from_set_id AS clonedFromSetId, s.created_by AS createdBy,
  s.created_at AS createdAt, s.updated_at AS updatedAt,
  (SELECT COUNT(*) FROM library_kpi k WHERE k.set_id = s.id) AS kpiCount
`;

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM strategic_set s ORDER BY s.start_year DESC, s.id DESC`,
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load strategic sets" },
      { status: 500 },
    );
  }
}

// Default categories seeded into every brand-new (non-cloned) set — mirrors the
// original global KPI_CATEGORIES.
const DEFAULT_KPI_CATEGORIES: { name: string; description: string }[] = [
  { name: "Student Success", description: "Graduation, licensure and post-grad outcomes." },
  { name: "Faculty Excellence", description: "Faculty qualifications and development." },
  { name: "Research Output", description: "Publications, grants and research productivity." },
  { name: "Operational Efficiency", description: "Ratios and resource utilisation." },
  { name: "Financial Health", description: "Cost and financial sustainability measures." },
];

// Turn a name into a stable slug id (matches app/api/kpi-categories/route.ts).
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// A globally-unique category id (slug + numeric suffix on collision).
async function nextCategoryId(conn: PoolConnection, name: string): Promise<string> {
  const base = slugify(name) || "category";
  let id = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM kpi_categories WHERE id = ?",
      [id],
    );
    if (rows.length === 0) return id;
    n += 1;
    id = `${base}_${n}`.slice(0, 40);
  }
}

// Seed the default categories for a fresh (non-cloned) set.
async function seedDefaultCategories(conn: PoolConnection, setId: number) {
  let sort = 1;
  for (const c of DEFAULT_KPI_CATEGORIES) {
    const id = await nextCategoryId(conn, c.name);
    await conn.query(
      "INSERT INTO kpi_categories (id, set_id, name, description, sort_order) VALUES (?,?,?,?,?)",
      [id, setId, c.name, c.description, sort++],
    );
  }
}

// Deep-copy every library KPI/metric (and their annual targets) from a source
// set into the newly created set. formula_id is preserved as-is (formulas are
// global/reusable across sets). The source set's categories are cloned first
// and KPI/metric category_id values are remapped to the new copies.
async function cloneSetContents(
  conn: PoolConnection,
  sourceSetId: number,
  newSetId: number,
) {
  // Clone categories, building an old id → new id map for the remap below.
  const [srcCats] = await conn.query<RowDataPacket[]>(
    "SELECT id, name, description, sort_order FROM kpi_categories WHERE set_id = ? ORDER BY sort_order, id",
    [sourceSetId],
  );
  const catIdMap = new Map<string, string>();
  for (const c of srcCats) {
    const newId = await nextCategoryId(conn, c.name);
    await conn.query(
      "INSERT INTO kpi_categories (id, set_id, name, description, sort_order) VALUES (?,?,?,?,?)",
      [newId, newSetId, c.name, c.description, c.sort_order],
    );
    catIdMap.set(c.id, newId);
  }
  const mapCat = (oldId: string | null) => (oldId == null ? null : catIdMap.get(oldId) ?? null);

  const [srcKpis] = await conn.query<RowDataPacket[]>(
    "SELECT * FROM library_kpi WHERE set_id = ? ORDER BY sort_order, id",
    [sourceSetId],
  );

  for (const k of srcKpis) {
    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO library_kpi
         (set_id, name, description, category_id, kpi_type, data_collect_method,
          collection_period, data_source_url, committee_id, person_in_charge_id,
          weight, unit, five_year_target, calculation_type, calculation_logic,
          formula_id, threshold_green, threshold_amber, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newSetId, k.name, k.description, mapCat(k.category_id), k.kpi_type,
        k.data_collect_method, k.collection_period, k.data_source_url,
        k.committee_id, k.person_in_charge_id, k.weight, k.unit,
        k.five_year_target, k.calculation_type, k.calculation_logic,
        k.formula_id, k.threshold_green, k.threshold_amber, k.sort_order,
      ],
    );
    const newKpiId = ins.insertId;

    await conn.query(
      `INSERT INTO library_kpi_annual_target (kpi_id, year_no, target_value)
       SELECT ?, year_no, target_value FROM library_kpi_annual_target WHERE kpi_id = ?`,
      [newKpiId, k.id],
    );

    const [srcMetrics] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM library_metric WHERE kpi_id = ? ORDER BY sort_order, id",
      [k.id],
    );
    for (const m of srcMetrics) {
      const [minsert] = await conn.query<ResultSetHeader>(
        `INSERT INTO library_metric
           (kpi_id, name, description, category_id, data_collect_method,
            collection_period, data_source_url, committee_id, person_in_charge_id,
            weight, unit, five_year_target, threshold_green, threshold_amber, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          newKpiId, m.name, m.description, mapCat(m.category_id), m.data_collect_method,
          m.collection_period, m.data_source_url, m.committee_id,
          m.person_in_charge_id, m.weight, m.unit, m.five_year_target,
          m.threshold_green, m.threshold_amber, m.sort_order,
        ],
      );
      await conn.query(
        `INSERT INTO library_metric_annual_target (metric_id, year_no, target_value)
         SELECT ?, year_no, target_value FROM library_metric_annual_target WHERE metric_id = ?`,
        [minsert.insertId, m.id],
      );
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, startYear, cloneFromSetId, createdBy } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const start = Number(startYear);
    if (!Number.isInteger(start) || start < 2400 || start > 2700) {
      return NextResponse.json(
        { error: "startYear must be a valid Buddhist-era year" },
        { status: 400 },
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let insertId: number;
      try {
        const [ins] = await conn.query<ResultSetHeader>(
          `INSERT INTO strategic_set (name, description, start_year, status, cloned_from_set_id, created_by)
           VALUES (?, ?, ?, 'draft', ?, ?)`,
          [name.trim(), description?.trim() || null, start, cloneFromSetId ?? null, createdBy ?? null],
        );
        insertId = ins.insertId;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && err.code === "ER_DUP_ENTRY") {
          await conn.rollback();
          return NextResponse.json(
            { error: `A strategic set starting in ${start} already exists` },
            { status: 409 },
          );
        }
        throw err;
      }

      if (cloneFromSetId) {
        await cloneSetContents(conn, Number(cloneFromSetId), insertId);
      } else {
        await seedDefaultCategories(conn, insertId);
      }

      await conn.commit();

      const [created] = await conn.query<RowDataPacket[]>(
        `SELECT ${SELECT_FIELDS} FROM strategic_set s WHERE s.id = ?`,
        [insertId],
      );
      return NextResponse.json(created[0], { status: 201 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create strategic set" },
      { status: 500 },
    );
  }
}
