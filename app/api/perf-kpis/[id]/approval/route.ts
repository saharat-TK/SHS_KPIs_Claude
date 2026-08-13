import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { ApprovalAction, ApprovalState } from "@/lib/types";
import {
  authorizingStage,
  nextState,
  actionRequiresComment,
  resolveStageRoles,
} from "@/lib/kpi/approvalWorkflow";
import { APPROVAL_SELECT, resolvePosition, resolveSystemRole } from "@/lib/kpi/approvalServer";
import { requirePermission, actorErrorResponse } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const EVENT_SELECT = `
  id, approval_id AS approvalId, actor_id AS actorId, actor_name AS actorName,
  actor_role AS actorRole, action, from_state AS fromState, to_state AS toState,
  comment, created_at AS createdAt
`;

// Load the approval row (implicit draft if none) plus its event thread.
async function loadApproval(
  perfKpiId: string,
  yearNo: number,
  quarterNo: number,
) {
  const [kpiRows] = await pool.query<RowDataPacket[]>(
    `SELECT k.id, k.record_id AS recordId, k.committee_id AS committeeId,
            k.name AS kpiName, k.unit, k.has_children AS hasChildren
     FROM perf_kpi k WHERE k.id = ?`,
    [perfKpiId],
  );
  if (kpiRows.length === 0) return null;
  const kpi = kpiRows[0];

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${APPROVAL_SELECT} FROM perf_kpi_approval a
     WHERE a.perf_kpi_id = ? AND a.year_no = ? AND a.quarter_no = ?`,
    [perfKpiId, yearNo, quarterNo],
  );
  const row = rows[0];

  let events: RowDataPacket[] = [];
  if (row) {
    const [ev] = await pool.query<RowDataPacket[]>(
      `SELECT ${EVENT_SELECT} FROM perf_kpi_approval_event
       WHERE approval_id = ? ORDER BY created_at, id`,
      [row.id],
    );
    events = ev;
  }

  const approval = row ?? {
    id: null,
    perfKpiId: Number(perfKpiId),
    recordId: kpi.recordId,
    committeeId: kpi.committeeId,
    yearNo,
    quarterNo,
    state: "draft" as ApprovalState,
    submittedBy: null, submittedAt: null,
    forwardedBy: null, forwardedAt: null,
    approvedBy: null, approvedAt: null,
  };

  return {
    approval: {
      ...approval,
      kpiName: kpi.kpiName,
      unit: kpi.unit,
      hasChildren: !!kpi.hasChildren,
    },
    events,
  };
}

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
    const data = await loadApproval(params.id, yearNo, quarterNo);
    if (!data) {
      return NextResponse.json({ error: "Performance KPI not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load approval" },
      { status: 500 },
    );
  }
}

// Columns to stamp for each action (besides `state`, always set).
function stampFor(action: ApprovalAction, actorId: string | null) {
  switch (action) {
    case "submit":
      return { submitted_by: actorId, submitted_at: "NOW" };
    case "forward":
      return { forwarded_by: actorId, forwarded_at: "NOW" };
    case "approve":
      return { approved_by: actorId, approved_at: "NOW" };
    case "reverse":
      // Un-approve and un-forward so the returned record can be corrected.
      return {
        forwarded_by: null,
        forwarded_at: null,
        approved_by: null,
        approved_at: null,
      };
    default:
      return {};
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requirePermission("record_performance");
    const b = await req.json();
    const action = b.action as ApprovalAction;
    const yearNo = Number(b.yearNo);
    const quarterNo = Number(b.quarterNo);
    // From the session, never the body. The stage-role resolution below was
    // always DB-backed, but it used to be keyed by an id the caller chose.
    const actorId: string = actor.facultyId;
    const actorName: string = actor.name;
    const comment: string | null = b.comment?.trim() ? b.comment.trim() : null;

    if (!(yearNo >= 1 && yearNo <= 5) || !(quarterNo >= 1 && quarterNo <= 4)) {
      return NextResponse.json({ error: "Invalid yearNo/quarterNo" }, { status: 400 });
    }
    if (actionRequiresComment(action) && !comment) {
      return NextResponse.json({ error: "A note is required for this action" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [kpiRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, record_id AS recordId, committee_id AS committeeId
         FROM perf_kpi WHERE id = ? FOR UPDATE`,
        [params.id],
      );
      if (kpiRows.length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "Performance KPI not found" }, { status: 404 });
      }
      const kpi = kpiRows[0];

      // Resolve the actor's stage role from their committee position and their
      // system role. Both come from the DB keyed by the session's facultyId,
      // so a caller can neither claim admin nor act as someone else.
      const position = await resolvePosition(conn, actorId, kpi.committeeId);
      const isAdmin = (await resolveSystemRole(conn, actorId)) === "admin";
      const stageRoles = resolveStageRoles(position, isAdmin);

      const [existing] = await conn.query<RowDataPacket[]>(
        `SELECT id, state FROM perf_kpi_approval
         WHERE perf_kpi_id = ? AND year_no = ? AND quarter_no = ? FOR UPDATE`,
        [params.id, yearNo, quarterNo],
      );
      const fromState: ApprovalState = (existing[0]?.state as ApprovalState) ?? "draft";

      // The stage that actually authorises this move is what the audit trail
      // records — an admin who is also a lead forwards *as* the lead.
      const actingStage = authorizingStage(stageRoles, fromState, action);
      if (!actingStage) {
        await conn.rollback();
        return NextResponse.json(
          {
            error: `You cannot ${action} a submission in "${fromState}" state with your role.`,
          },
          { status: 403 },
        );
      }
      const toState = nextState(action)!;

      // Upsert the approval row, stamping the columns relevant to this action.
      const stamp = stampFor(action, actorId);
      const setCols = ["state = ?"];
      const insertCols = ["perf_kpi_id", "record_id", "committee_id", "year_no", "quarter_no", "state"];
      const insertVals: unknown[] = [params.id, kpi.recordId, kpi.committeeId, yearNo, quarterNo, toState];
      const insertPlaceholders = ["?", "?", "?", "?", "?", "?"];
      const updateVals: unknown[] = [toState];
      for (const [col, val] of Object.entries(stamp)) {
        if (val === "NOW") {
          insertCols.push(col); insertPlaceholders.push("CURRENT_TIMESTAMP");
          setCols.push(`${col} = CURRENT_TIMESTAMP`);
        } else {
          insertCols.push(col); insertPlaceholders.push("?"); insertVals.push(val);
          setCols.push(`${col} = ?`); updateVals.push(val);
        }
      }

      await conn.query<ResultSetHeader>(
        `INSERT INTO perf_kpi_approval (${insertCols.join(", ")})
         VALUES (${insertPlaceholders.join(", ")})
         ON DUPLICATE KEY UPDATE ${setCols.join(", ")}`,
        [...insertVals, ...updateVals],
      );

      const [idRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM perf_kpi_approval
         WHERE perf_kpi_id = ? AND year_no = ? AND quarter_no = ?`,
        [params.id, yearNo, quarterNo],
      );
      const approvalId = idRows[0].id;

      // The audit trail records the *human who clicked*, not the identity they
      // were acting as. While an admin is impersonating, the transition is
      // authorised by the impersonated person's position (that is what
      // actingStage above resolved), but recording only them would make the
      // log say someone approved something they never touched.
      await conn.query(
        `INSERT INTO perf_kpi_approval_event
           (approval_id, actor_id, actor_name, actor_role, action, from_state, to_state, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          approvalId,
          actor.realFacultyId,
          actor.impersonating ? `${actor.realName} (as ${actorName})` : actorName,
          actingStage,
          action,
          fromState,
          toState,
          comment,
        ],
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const data = await loadApproval(params.id, yearNo, quarterNo);
    return NextResponse.json(data);
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to update approval" },
        { status: 500 },
      )
    );
  }
}
