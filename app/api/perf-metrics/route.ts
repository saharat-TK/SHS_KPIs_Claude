import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { PERF_METRIC_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const perfKpiId = req.nextUrl.searchParams.get("perfKpiId");
    if (!perfKpiId) {
      return NextResponse.json({ error: "perfKpiId is required" }, { status: 400 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PERF_METRIC_FIELDS} FROM perf_metric m WHERE m.perf_kpi_id = ? ORDER BY m.sort_order, m.id`,
      [perfKpiId],
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance metrics" },
      { status: 500 },
    );
  }
}
