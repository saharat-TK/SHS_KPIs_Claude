import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// Upsert one quarter of KPI progress. For a leaf KPI the user enters
// progress_value directly; for a has_children KPI the value is roll-up-computed
// (from metrics) so we only record the required Issue/Solution here.
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
      return NextResponse.json(
        { error: "issue and solution are required" },
        { status: 400 },
      );
    }

    const [kpiRows] = await pool.query<RowDataPacket[]>(
      "SELECT has_children FROM perf_kpi WHERE id = ?",
      [params.id],
    );
    if (kpiRows.length === 0) {
      return NextResponse.json({ error: "Performance KPI not found" }, { status: 404 });
    }
    const isLeaf = !kpiRows[0].has_children;
    const recordedBy = (b.recordedBy as string) ?? null;

    if (isLeaf) {
      const value = b.progressValue == null || b.progressValue === "" ? null : Number(b.progressValue);
      await pool.query(
        `INSERT INTO perf_kpi_quarter_progress
           (perf_kpi_id, year_no, quarter_no, progress_value, is_computed, issue, solution, recorded_by, recorded_at)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value), is_computed = 0,
           issue = VALUES(issue), solution = VALUES(solution),
           recorded_by = VALUES(recorded_by), recorded_at = CURRENT_TIMESTAMP`,
        [params.id, yearNo, quarterNo, value, b.issue.trim(), b.solution.trim(), recordedBy],
      );
    } else {
      // Computed KPI: preserve the roll-up progress_value, only update Issue.
      await pool.query(
        `INSERT INTO perf_kpi_quarter_progress
           (perf_kpi_id, year_no, quarter_no, progress_value, is_computed, issue, solution, recorded_by, recorded_at)
         VALUES (?, ?, ?, NULL, 1, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE issue = VALUES(issue), solution = VALUES(solution),
           recorded_by = VALUES(recorded_by), recorded_at = CURRENT_TIMESTAMP`,
        [params.id, yearNo, quarterNo, b.issue.trim(), b.solution.trim(), recordedBy],
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT year_no AS yearNo, quarter_no AS quarterNo, progress_value AS progressValue,
              is_computed AS isComputed, issue, solution
       FROM perf_kpi_quarter_progress WHERE perf_kpi_id = ? ORDER BY year_no, quarter_no`,
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
