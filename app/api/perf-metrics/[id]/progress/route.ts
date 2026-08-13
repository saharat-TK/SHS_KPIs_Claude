import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import type { ApprovalState } from "@/lib/types";
import { recomputeKpiQuarter } from "@/lib/kpi/performance";
import { METRIC_QUARTER_PROGRESS_FIELDS } from "@/lib/kpi/fields";
import { getApprovalState, resolvePosition, resolveSystemRole } from "@/lib/kpi/approvalServer";
import { approvalLockForState, resolveStageRoles } from "@/lib/kpi/approvalWorkflow";
import { requirePermission, actorErrorResponse } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Upsert one quarter of metric progress (direct entry), then recompute the
// parent KPI's roll-up for that quarter. Issue/Solution are required.
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requirePermission("record_performance");
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
        `SELECT m.perf_kpi_id, k.record_id AS recordId, k.committee_id AS committeeId,
                r.status AS recordStatus,
                COALESCE(p.is_open, 0) AS isOpen
         FROM perf_metric m
         JOIN perf_kpi k ON k.id = m.perf_kpi_id
         JOIN performance_record r ON r.id = k.record_id
         LEFT JOIN performance_record_period p
           ON p.record_id = k.record_id AND p.year_no = ? AND p.quarter_no = ?
         WHERE m.id = ?`,
        [yearNo, quarterNo, params.id],
      );
      if (metricRows.length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "Performance metric not found" }, { status: 404 });
      }
      if (metricRows[0].recordStatus !== "active") {
        await conn.rollback();
        return NextResponse.json(
          { error: "This performance record is inactive or completed and is view-only" },
          { status: 409 },
        );
      }
      if (!metricRows[0].isOpen) {
        await conn.rollback();
        return NextResponse.json(
          { error: "This recording period is closed" },
          { status: 409 },
        );
      }
      // Approval lock: a metric inherits its parent KPI's review/final lock.
      const approvalState = await getApprovalState(conn, metricRows[0].perf_kpi_id, yearNo, quarterNo);
      const approvalLock = approvalLockForState(approvalState);
      // Identity comes from the session; position and system role are then read
      // from the DB against it. Nothing about the actor is taken from the body.
      const actorId: string = actor.facultyId;
      const position = await resolvePosition(conn, actorId, metricRows[0].committeeId);
      const isAdmin = (await resolveSystemRole(conn, actorId)) === "admin";
      const stageRoles = resolveStageRoles(position, isAdmin);
      const canLeadEditSubmitted =
        approvalState === ("submitted" as ApprovalState) && stageRoles.includes("lead");
      const canCounselorEditForwarded =
        approvalState === ("forwarded" as ApprovalState) && stageRoles.includes("counselor");
      if (approvalLock?.locked && !canLeadEditSubmitted && !canCounselorEditForwarded) {
        await conn.rollback();
        return NextResponse.json(
          { error: approvalLock.label },
          { status: 409 },
        );
      }

      // is_computed = 0 marks this as hand-entered, matching the KPI route.
      // Without it a value typed over a fed metric stayed flagged as computed,
      // and the next feed run overwrote it with no trace.
      //
      // The variable columns hold the feed's numerator/denominator — a metric has
      // no variable inputs of its own — so a person overwriting the value must
      // clear them, or "22 of 29" would assert a basis the new number lacks. But
      // only then: a fed metric is value-read-only and still saves Issue and
      // Solution through here (approval demands them), echoing the stored value
      // back, and that must not strip the pair it is still the basis for.
      //
      // Both guards read progress_value BEFORE it is reassigned, so they must
      // stay above it — MySQL evaluates these assignments left to right.
      await conn.query(
        `INSERT INTO perf_metric_quarter_progress
           (perf_metric_id, year_no, quarter_no, progress_value, variable1_value, variable2_value,
            is_computed, issue, solution, recorded_by, recorded_at)
         VALUES (?, ?, ?, ?, NULL, NULL, 0, ?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE
           variable1_value = IF(progress_value <=> VALUES(progress_value), variable1_value, NULL),
           variable2_value = IF(progress_value <=> VALUES(progress_value), variable2_value, NULL),
           progress_value = VALUES(progress_value),
           is_computed = 0, issue = VALUES(issue), solution = VALUES(solution),
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
      `SELECT ${METRIC_QUARTER_PROGRESS_FIELDS}
       FROM perf_metric_quarter_progress WHERE perf_metric_id = ? ORDER BY year_no, quarter_no`,
      [params.id],
    );
    return NextResponse.json(rows);
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to save progress" },
        { status: 500 },
      )
    );
  }
}
