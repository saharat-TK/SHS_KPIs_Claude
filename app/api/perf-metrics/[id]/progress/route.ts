import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { recomputeKpiQuarter } from "@/lib/kpi/performance";

export const dynamic = "force-dynamic";

// Upsert one quarter of metric progress (direct entry), then recompute the
// parent KPI's roll-up for that quarter. Issue/Solution are required.
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const b = await req.json();
    const yearNo = Number(b.yearNo);
    const quarterNo = Number(b.quarterNo);
    if (!(yearNo >= 1 && yearNo <= 5) || !(quarterNo >= 1 && quarterNo <= 4)) {
      return NextResponse.json({ error: "Invalid yearNo/quarterNo" }, { status: 400 });
    }
    if (!b.issue?.trim() || !b.solution?.trim()) {
      return NextResponse.json({ error: "issue and solution are required" }, { status: 400 });
    }
    const value = b.progressValue == null || b.progressValue === "" ? null : Number(b.progressValue);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [metricRows] = await conn.query<RowDataPacket[]>(
        "SELECT perf_kpi_id FROM perf_metric WHERE id = ?",
        [params.id],
      );
      if (metricRows.length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "Performance metric not found" }, { status: 404 });
      }

      await conn.query(
        `INSERT INTO perf_metric_quarter_progress
           (perf_metric_id, year_no, quarter_no, progress_value, issue, solution, recorded_by, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value),
           issue = VALUES(issue), solution = VALUES(solution),
           recorded_by = VALUES(recorded_by), recorded_at = CURRENT_TIMESTAMP`,
        [params.id, yearNo, quarterNo, value, b.issue.trim(), b.solution.trim(), b.recordedBy ?? null],
      );

      await recomputeKpiQuarter(conn, metricRows[0].perf_kpi_id, yearNo, quarterNo);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT year_no AS yearNo, quarter_no AS quarterNo, progress_value AS progressValue, issue, solution
       FROM perf_metric_quarter_progress WHERE perf_metric_id = ? ORDER BY year_no, quarter_no`,
      [params.id],
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save progress" },
      { status: 500 },
    );
  }
}
