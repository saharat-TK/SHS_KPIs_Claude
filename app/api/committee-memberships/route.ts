import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

// Note: committees.name here comes from the same in-memory-seeded `committees`
// table used elsewhere in this DB — the app's Committee list UI is still
// mock-sourced, but the IDs line up 1:1 with this table since both originate
// from the same seed data. If the mock committees ever diverge, this join
// (INNER JOIN) will silently drop membership rows whose committee_id no
// longer matches.
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

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `${SELECT_JOIN} ORDER BY c.name, f.name`,
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load committee memberships" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { facultyId, committeeId, position, kpiFocus } = body;

    if (!facultyId || !committeeId || !position || !kpiFocus) {
      return NextResponse.json(
        { error: "facultyId, committeeId, position, and kpiFocus are required" },
        { status: 400 },
      );
    }

    try {
      await pool.query<ResultSetHeader>(
        `INSERT INTO committee_memberships (faculty_id, committee_id, position, kpi_focus)
         VALUES (?, ?, ?, ?)`,
        [facultyId, committeeId, position, kpiFocus],
      );
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "ER_DUP_ENTRY"
      ) {
        return NextResponse.json(
          { error: "This faculty member is already assigned to this committee" },
          { status: 409 },
        );
      }
      throw err;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `${SELECT_JOIN} WHERE cm.faculty_id = ? AND cm.committee_id = ?`,
      [facultyId, committeeId],
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create membership" },
      { status: 500 },
    );
  }
}
