import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { isPerformanceStatus } from "@/lib/kpi/performanceRecordStatus";

export const dynamic = "force-dynamic";

const SELECT_FIELDS = `
  r.id, r.source_set_id AS sourceSetId, r.name,
  r.start_year AS startYear, r.end_year AS endYear, r.status,
  r.activated_by AS activatedBy, r.activated_at AS activatedAt,
  r.last_synced_at AS lastSyncedAt,
  (SELECT COUNT(*) FROM perf_kpi k WHERE k.record_id = r.id) AS kpiCount
`;

const COLUMN_MAP: Record<string, string> = {
  name: "name",
  status: "status",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM performance_record r WHERE r.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Performance record not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance record" },
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
    if ("status" in body && !isPerformanceStatus(body.status)) {
      return NextResponse.json({ error: "Invalid performance record status" }, { status: 400 });
    }
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
      `UPDATE performance_record SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Performance record not found" }, { status: 404 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM performance_record r WHERE r.id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update performance record" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // perf_kpi / perf_metric / targets / progress cascade via FK.
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM performance_record WHERE id = ?",
      [params.id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Performance record not found" }, { status: 404 });
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete performance record" },
      { status: 500 },
    );
  }
}
