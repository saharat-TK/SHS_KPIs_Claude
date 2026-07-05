import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, unit_name_th AS unitNameTh, unit_name_en AS unitNameEn, description";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM units ORDER BY unit_name_en`,
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load units" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const unitNameTh = cleanString(body.unitNameTh);
    const unitNameEn = cleanString(body.unitNameEn);
    const description = cleanNullableString(body.description);

    if (!unitNameTh || !unitNameEn) {
      return NextResponse.json(
        { error: "Thai and English unit names are required" },
        { status: 400 },
      );
    }

    let insertId: number;
    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO units (unit_name_th, unit_name_en, description) VALUES (?, ?, ?)`,
        [unitNameTh, unitNameEn, description],
      );
      insertId = result.insertId;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && err.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { error: "A unit with this English name already exists" },
          { status: 409 },
        );
      }
      throw err;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM units WHERE id = ?`,
      [insertId],
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create unit" },
      { status: 500 },
    );
  }
}
