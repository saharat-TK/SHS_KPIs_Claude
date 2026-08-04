import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import { describeCommitteeUsage } from "@/lib/kpi/committee";
import { loadCommitteeUsage } from "@/lib/kpi/committeeServer";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, name, faculty, status, head_id AS headId, key_metric AS keyMetric";

const COLUMN_MAP: Record<string, string> = {
  name: "name",
  faculty: "faculty",
  status: "status",
  headId: "head_id",
  keyMetric: "key_metric",
};

const STATUSES = ["active", "inactive", "draft"];

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM committees WHERE id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Committee not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load committee" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, column] of Object.entries(COLUMN_MAP)) {
      if (!(key in body)) continue;
      const v = body[key];

      if (key === "name" && !cleanString(v)) {
        return NextResponse.json(
          { error: "Committee name cannot be blank" },
          { status: 400 },
        );
      }
      if (key === "status" && !STATUSES.includes(cleanString(v))) {
        return NextResponse.json({ error: "Invalid committee status" }, { status: 400 });
      }

      setClauses.push(`${column} = ?`);
      // headId is the only nullable column here — "" means "clear the lead".
      values.push(key === "headId" ? cleanNullableString(v) : cleanString(v));
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(params.id);
    let result: ResultSetHeader;
    try {
      [result] = await pool.query<ResultSetHeader>(
        `UPDATE committees SET ${setClauses.join(", ")} WHERE id = ?`,
        values,
      );
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "ER_NO_REFERENCED_ROW_2"
      ) {
        return NextResponse.json(
          { error: "Selected lead faculty member no longer exists" },
          { status: 400 },
        );
      }
      throw err;
    }

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Committee not found" }, { status: 404 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM committees WHERE id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update committee" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // The client disables the button using the same rule, but authority is here:
    // deleting would cascade the roster away and unassign library KPIs/metrics.
    const blocked = describeCommitteeUsage(await loadCommitteeUsage(pool, params.id));
    if (blocked) {
      return NextResponse.json({ error: blocked }, { status: 409 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM committees WHERE id = ?",
      [params.id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Committee not found" }, { status: 404 });
    }

    return NextResponse.json({ id: params.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete committee" },
      { status: 500 },
    );
  }
}
