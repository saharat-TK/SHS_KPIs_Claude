import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS = `
  s.id, s.name, s.description,
  s.start_year AS startYear, s.end_year AS endYear, s.status,
  s.cloned_from_set_id AS clonedFromSetId, s.created_by AS createdBy,
  s.created_at AS createdAt, s.updated_at AS updatedAt,
  (SELECT COUNT(*) FROM library_kpi k WHERE k.set_id = s.id) AS kpiCount
`;

// Editable columns only — start_year/end_year are fixed once a set exists.
const COLUMN_MAP: Record<string, string> = {
  name: "name",
  description: "description",
  status: "status",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM strategic_set s WHERE s.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Strategic set not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load strategic set" },
      { status: 500 },
    );
  }
}

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
      `UPDATE strategic_set SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Strategic set not found" }, { status: 404 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM strategic_set s WHERE s.id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update strategic set" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // library_kpi / metrics / targets cascade via FK ON DELETE CASCADE.
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM strategic_set WHERE id = ?",
      [params.id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Strategic set not found" }, { status: 404 });
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete strategic set" },
      { status: 500 },
    );
  }
}
