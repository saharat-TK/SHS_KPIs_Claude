import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, set_id AS setId, name AS label, description, sort_order AS sortOrder";

// Turn a display name into a stable slug id (e.g. "Research Output" -> "research_output").
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function GET(req: NextRequest) {
  try {
    // Scope to a strategic set when ?setId is provided; otherwise return all
    // (legacy/global consumers such as the prototype manager and dashboard).
    const setIdParam = req.nextUrl.searchParams.get("setId");
    const rows = setIdParam
      ? (
          await pool.query<RowDataPacket[]>(
            `SELECT ${SELECT_FIELDS} FROM kpi_categories WHERE set_id = ? ORDER BY sort_order, id`,
            [Number(setIdParam)],
          )
        )[0]
      : (
          await pool.query<RowDataPacket[]>(
            `SELECT ${SELECT_FIELDS} FROM kpi_categories ORDER BY sort_order, id`,
          )
        )[0];
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load categories" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, sortOrder, setId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const set = setId == null ? null : Number(setId);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Generate a unique slug id, adding a numeric suffix on collision.
      const base = slugify(name) || "category";
      let id = base;
      let n = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [existing] = await conn.query<RowDataPacket[]>(
          "SELECT id FROM kpi_categories WHERE id = ?",
          [id],
        );
        if (existing.length === 0) break;
        n += 1;
        id = `${base}_${n}`.slice(0, 40);
      }

      // Default sort order to the end of this set's list when not provided.
      let order = sortOrder;
      if (order === undefined || order === null) {
        const [maxRow] = await conn.query<RowDataPacket[]>(
          set == null
            ? "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM kpi_categories WHERE set_id IS NULL"
            : "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM kpi_categories WHERE set_id = ?",
          set == null ? [] : [set],
        );
        order = maxRow[0]?.next ?? 1;
      }

      await conn.query<ResultSetHeader>(
        `INSERT INTO kpi_categories (id, set_id, name, description, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [id, set, name.trim(), description?.trim() || null, order],
      );

      await conn.commit();

      const [created] = await conn.query<RowDataPacket[]>(
        `SELECT ${SELECT_FIELDS} FROM kpi_categories WHERE id = ?`,
        [id],
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
      { error: err instanceof Error ? err.message : "Failed to create category" },
      { status: 500 },
    );
  }
}
