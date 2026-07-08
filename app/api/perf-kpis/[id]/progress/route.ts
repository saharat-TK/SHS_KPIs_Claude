import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import type { ApprovalState, Role } from "@/lib/types";
import { unitNeedsDivisor, kpiValueFromVariables } from "@/lib/kpi/progress";
import { getApprovalState, resolvePosition } from "@/lib/kpi/approvalServer";
import { approvalLockForState, resolveStageRole } from "@/lib/kpi/approvalWorkflow";

export const dynamic = "force-dynamic";

function numOrNull(v: unknown): number | null {
  return v == null || v === "" ? null : Number(v);
}

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
      `SELECT k.has_children, k.unit, k.variable1_name AS variable1Name,
              k.record_id AS recordId, k.committee_id AS committeeId,
              COALESCE(p.is_open, 0) AS isOpen
       FROM perf_kpi k
       LEFT JOIN performance_record_period p
         ON p.record_id = k.record_id AND p.year_no = ? AND p.quarter_no = ?
       WHERE k.id = ?`,
      [yearNo, quarterNo, params.id],
    );
    if (kpiRows.length === 0) {
      return NextResponse.json({ error: "Performance KPI not found" }, { status: 404 });
    }
    if (!kpiRows[0].isOpen) {
      return NextResponse.json(
        { error: "This recording period is closed" },
        { status: 409 },
      );
    }
    // Approval lock: once a KPI quarter is under review or approved, its data
    // (and its metrics') is read-only until it is sent back or reversed.
    const approvalState = await getApprovalState(pool, params.id, yearNo, quarterNo);
    const approvalLock = approvalLockForState(approvalState);
    const actorId: string | null = b.actorId ?? null;
    const userRole = b.userRole as Role | undefined;
    const position = actorId
      ? await resolvePosition(pool, actorId, kpiRows[0].committeeId)
      : null;
    const canLeadEditSubmitted =
      approvalState === ("submitted" as ApprovalState) &&
      resolveStageRole(position, userRole) === "lead";
    const canCounselorEditForwarded =
      approvalState === ("forwarded" as ApprovalState) &&
      resolveStageRole(position, userRole) === "counselor";
    if (approvalLock?.locked && !canLeadEditSubmitted && !canCounselorEditForwarded) {
      return NextResponse.json(
        { error: approvalLock.label },
        { status: 409 },
      );
    }
    const isLeaf = !kpiRows[0].has_children;
    const recordedBy = (b.recordedBy as string) ?? null;

    if (isLeaf) {
      const usesVariables = !!kpiRows[0].variable1Name;
      const unit = kpiRows[0].unit as string | null;
      let value: number | null;
      let var1: number | null = null;
      let var2: number | null = null;

      if (usesVariables) {
        // Value is derived from the entered variables; the raw values are stored.
        var1 = numOrNull(b.variable1Value);
        var2 = numOrNull(b.variable2Value);
        if (var1 == null) {
          return NextResponse.json(
            { error: "Variable 1 is required" },
            { status: 400 },
          );
        }
        if (unitNeedsDivisor(unit) && var2 == null) {
          return NextResponse.json(
            { error: "Variable 2 is required for Percent/Ratio units" },
            { status: 400 },
          );
        }
        value = kpiValueFromVariables(unit, var1, var2);
      } else {
        // Legacy leaf KPI without variable definitions: direct value entry.
        value = numOrNull(b.progressValue);
      }

      await pool.query(
        `INSERT INTO perf_kpi_quarter_progress
           (perf_kpi_id, year_no, quarter_no, progress_value, variable1_value, variable2_value,
            is_computed, issue, solution, recorded_by, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value),
           variable1_value = VALUES(variable1_value), variable2_value = VALUES(variable2_value),
           is_computed = 0, issue = VALUES(issue), solution = VALUES(solution),
           recorded_by = VALUES(recorded_by), recorded_at = CURRENT_TIMESTAMP`,
        [params.id, yearNo, quarterNo, value, var1, var2, b.issue.trim(), b.solution.trim(), recordedBy],
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
              variable1_value AS variable1Value, variable2_value AS variable2Value,
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
