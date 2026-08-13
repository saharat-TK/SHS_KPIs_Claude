import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { requirePermission, actorErrorResponse } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, name, `rank`, email, name_TH AS nameTh, program, status, system_role AS systemRole";

const COLUMN_MAP: Record<string, string> = {
  name: "name",
  rank: "`rank`",
  email: "email",
  nameTh: "name_TH",
  program: "program",
  status: "status",
  systemRole: "system_role",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // COLUMN_MAP includes systemRole, so this endpoint grants app access.
    // Unauthenticated, it was a one-request path to admin.
    await requirePermission("manage_faculty");
    const body = await req.json();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, column] of Object.entries(COLUMN_MAP)) {
      if (key in body) {
        setClauses.push(`${column} = ?`);
        values.push(body[key]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(params.id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE faculty SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Faculty member not found" }, { status: 404 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM faculty WHERE id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Failed to update faculty member",
        },
        { status: 500 },
      )
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requirePermission("manage_faculty");
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM faculty WHERE id = ?",
      [params.id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Faculty member not found" }, { status: 404 });
    }

    return NextResponse.json({ id: params.id });
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Failed to remove faculty member",
        },
        { status: 500 },
      )
    );
  }
}
