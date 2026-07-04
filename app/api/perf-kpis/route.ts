import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { PERF_KPI_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const recordId = req.nextUrl.searchParams.get("recordId");
    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PERF_KPI_FIELDS},
              (SELECT COUNT(*) FROM perf_metric m WHERE m.perf_kpi_id = k.id) AS metricCount
       FROM perf_kpi k WHERE k.record_id = ? ORDER BY k.sort_order, k.id`,
      [recordId],
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance KPIs" },
      { status: 500 },
    );
  }
}
