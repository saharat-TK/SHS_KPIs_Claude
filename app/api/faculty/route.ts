import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, name, `rank`, email, name_TH AS nameTh, program, status, system_role AS systemRole";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM faculty ORDER BY id`,
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load faculty" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, rank, email, nameTh, program, status, systemRole } = body;

    if (!name || !rank || !program) {
      return NextResponse.json(
        { error: "name, rank, and program are required" },
        { status: 400 },
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM faculty ORDER BY id DESC LIMIT 1",
      );
      const last = rows[0]?.id as string | undefined;
      const nextNum = last ? parseInt(last.slice(4), 10) + 1 : 1;
      const id = `fac-${String(nextNum).padStart(3, "0")}`;

      await conn.query<ResultSetHeader>(
        `INSERT INTO faculty (id, name, \`rank\`, email, name_TH, program, status, system_role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          rank,
          email ?? null,
          nameTh ?? null,
          program,
          status ?? "active",
          systemRole ?? "user",
        ],
      );

      await conn.commit();

      const [created] = await conn.query<RowDataPacket[]>(
        `SELECT ${SELECT_FIELDS} FROM faculty WHERE id = ?`,
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
      { error: err instanceof Error ? err.message : "Failed to create faculty member" },
      { status: 500 },
    );
  }
}
