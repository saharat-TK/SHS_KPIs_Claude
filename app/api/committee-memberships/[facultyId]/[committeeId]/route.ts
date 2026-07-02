import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_JOIN = `
  SELECT
    cm.faculty_id AS facultyId,
    cm.committee_id AS committeeId,
    cm.position,
    cm.kpi_focus AS kpiFocus,
    f.name AS facultyName,
    c.name AS committeeName
  FROM committee_memberships cm
  JOIN faculty f ON f.id = cm.faculty_id
  JOIN committees c ON c.id = cm.committee_id
`;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { facultyId: string; committeeId: string } },
) {
  try {
    const body = await req.json();
    const { position, kpiFocus } = body;

    if (!position && !kpiFocus) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    if (position) {
      setClauses.push("position = ?");
      values.push(position);
    }
    if (kpiFocus) {
      setClauses.push("kpi_focus = ?");
      values.push(kpiFocus);
    }
    values.push(params.facultyId, params.committeeId);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE committee_memberships SET ${setClauses.join(", ")} WHERE faculty_id = ? AND committee_id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `${SELECT_JOIN} WHERE cm.faculty_id = ? AND cm.committee_id = ?`,
      [params.facultyId, params.committeeId],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update membership" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { facultyId: string; committeeId: string } },
) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM committee_memberships WHERE faculty_id = ? AND committee_id = ?",
      [params.facultyId, params.committeeId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    return NextResponse.json({ facultyId: params.facultyId, committeeId: params.committeeId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove membership" },
      { status: 500 },
    );
  }
}
