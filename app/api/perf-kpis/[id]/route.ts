import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { PERF_KPI_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

// Single perf KPI with its annual targets, entered quarter progress, and the
// parent record's start year (for quarter/year labelling).
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PERF_KPI_FIELDS}, r.start_year AS startYear
       FROM perf_kpi k JOIN performance_record r ON r.id = k.record_id
       WHERE k.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Performance KPI not found" }, { status: 404 });
    }
    const [targets] = await pool.query<RowDataPacket[]>(
      "SELECT year_no AS yearNo, target_value AS targetValue FROM perf_kpi_annual_target WHERE perf_kpi_id = ? ORDER BY year_no",
      [params.id],
    );
    const [progress] = await pool.query<RowDataPacket[]>(
      `SELECT year_no AS yearNo, quarter_no AS quarterNo, progress_value AS progressValue,
              is_computed AS isComputed, issue, solution
       FROM perf_kpi_quarter_progress WHERE perf_kpi_id = ? ORDER BY year_no, quarter_no`,
      [params.id],
    );
    return NextResponse.json({ ...rows[0], annualTargets: targets, progress });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance KPI" },
      { status: 500 },
    );
  }
}
