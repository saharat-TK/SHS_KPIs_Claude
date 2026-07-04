import { NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// All formula versions across every formula, newest first — powers the Formula
// Version History audit log.
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, formula_id AS formulaId, version, expression, author,
              change_note AS changeNote, created_at AS createdAt
       FROM formula_version ORDER BY created_at DESC, id DESC`,
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load versions" },
      { status: 500 },
    );
  }
}
