import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, set_id AS setId, kpi_type AS kpiType, name AS label, description, sort_order AS sortOrder";

// Only editable fields; `id` (the stable slug) is intentionally immutable so
// existing KPIs keep mapping after a rename.
const COLUMN_MAP: Record<string, string> = {
  label: "name",
  description: "description",
  sortOrder: "sort_order",
  kpiType: "kpi_type",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, column] of Object.entries(COLUMN_MAP)) {
      if (key in body) {
        setClauses.push(`${column} = ?`);
        values.push(key === "description" ? body[key]?.trim() || null : body[key]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(params.id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE kpi_categories SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM kpi_categories WHERE id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM kpi_categories WHERE id = ?",
      [params.id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ id: params.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove category" },
      { status: 500 },
    );
  }
}
