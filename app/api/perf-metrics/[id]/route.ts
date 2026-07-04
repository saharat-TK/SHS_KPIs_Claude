import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { PERF_METRIC_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

// Single perf metric with annual targets, entered quarter progress, and the
// parent record's start year.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PERF_METRIC_FIELDS}, r.start_year AS startYear, k.record_id AS recordId
       FROM perf_metric m
       JOIN perf_kpi k ON k.id = m.perf_kpi_id
       JOIN performance_record r ON r.id = k.record_id
       WHERE m.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Performance metric not found" }, { status: 404 });
    }
    const [targets] = await pool.query<RowDataPacket[]>(
      "SELECT year_no AS yearNo, target_value AS targetValue FROM perf_metric_annual_target WHERE perf_metric_id = ? ORDER BY year_no",
      [params.id],
    );
    const [progress] = await pool.query<RowDataPacket[]>(
      `SELECT year_no AS yearNo, quarter_no AS quarterNo, progress_value AS progressValue, issue, solution
       FROM perf_metric_quarter_progress WHERE perf_metric_id = ? ORDER BY year_no, quarter_no`,
      [params.id],
    );
    return NextResponse.json({ ...rows[0], annualTargets: targets, progress });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance metric" },
      { status: 500 },
    );
  }
}
