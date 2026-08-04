import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

// List every KPI in a performance record for one (year, quarter), LEFT JOINed to
// its approval row (default "draft") and its recorded quarter value. Powers the
// Performance Approvals queue — one row per KPI, filterable by approval state.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const yearNo = Number(req.nextUrl.searchParams.get("yearNo"));
    const quarterNo = Number(req.nextUrl.searchParams.get("quarterNo"));
    if (!(yearNo >= 1 && yearNo <= 5) || !(quarterNo >= 1 && quarterNo <= 4)) {
      return NextResponse.json({ error: "Invalid yearNo/quarterNo" }, { status: 400 });
    }

    const [recRows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM performance_record WHERE id = ?",
      [params.id],
    );
    if (recRows.length === 0) {
      return NextResponse.json({ error: "Performance record not found" }, { status: 404 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         k.id                       AS perfKpiId,
         k.record_id                AS recordId,
         k.name                     AS kpiName,
         k.committee_id             AS committeeId,
         c.name                     AS committeeName,
         k.unit                     AS unit,
         k.has_children             AS hasChildren,
         k.threshold_green          AS thresholdGreen,
         k.threshold_amber          AS thresholdAmber,
         ?                          AS yearNo,
         ?                          AS quarterNo,
         tgt.target_value           AS annualTarget,
         qp.progress_value          AS progressValue,
         COALESCE(p.is_open, 0)     AS isOpen,
         a.id                       AS id,
         COALESCE(a.state, 'draft') AS state,
         a.submitted_by             AS submittedBy,
         a.submitted_at             AS submittedAt,
         a.forwarded_by             AS forwardedBy,
         a.forwarded_at             AS forwardedAt,
         a.approved_by              AS approvedBy,
         a.approved_at              AS approvedAt
       FROM perf_kpi k
       LEFT JOIN committees c ON c.id = k.committee_id
       LEFT JOIN perf_kpi_annual_target tgt
         ON tgt.perf_kpi_id = k.id AND tgt.year_no = ?
       LEFT JOIN perf_kpi_quarter_progress qp
         ON qp.perf_kpi_id = k.id AND qp.year_no = ? AND qp.quarter_no = ?
       LEFT JOIN perf_kpi_approval a
         ON a.perf_kpi_id = k.id AND a.year_no = ? AND a.quarter_no = ?
       LEFT JOIN performance_record_period p
         ON p.record_id = k.record_id AND p.year_no = ? AND p.quarter_no = ?
       WHERE k.record_id = ?
       ORDER BY k.sort_order, k.id`,
      [
        yearNo, quarterNo,
        yearNo,            // annual target join
        yearNo, quarterNo, // qp join
        yearNo, quarterNo, // approval join
        yearNo, quarterNo, // period join
        params.id,
      ],
    );

    return NextResponse.json(
      rows.map((r) => ({ ...r, hasChildren: !!r.hasChildren, isOpen: !!r.isOpen })),
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load approvals" },
      { status: 500 },
    );
  }
}
