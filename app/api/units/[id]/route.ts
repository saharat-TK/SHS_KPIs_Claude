import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, unit_name_th AS unitNameTh, unit_name_en AS unitNameEn, description";

const COLUMN_MAP: Record<string, string> = {
  unitNameTh: "unit_name_th",
  unitNameEn: "unit_name_en",
  description: "description",
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid unit id" }, { status: 400 });
    }

    const body = await req.json();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, column] of Object.entries(COLUMN_MAP)) {
      if (key in body) {
        const v = body[key];
        if ((key === "unitNameTh" || key === "unitNameEn") && !cleanString(v)) {
          return NextResponse.json(
            { error: "Thai and English unit names cannot be blank" },
            { status: 400 },
          );
        }

        setClauses.push(`${column} = ?`);
        values.push(key === "description" ? cleanNullableString(v) : cleanString(v));
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    let result: ResultSetHeader;
    try {
      [result] = await pool.query<ResultSetHeader>(
        `UPDATE units SET ${setClauses.join(", ")} WHERE id = ?`,
        values,
      );
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && err.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { error: "A unit with this English name already exists" },
          { status: 409 },
        );
      }
      throw err;
    }

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM units WHERE id = ?`,
      [id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update unit" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid unit id" }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM units WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove unit" },
      { status: 500 },
    );
  }
}
