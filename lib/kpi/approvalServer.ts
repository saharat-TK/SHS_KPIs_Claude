// Server-only helpers for the performance-approval workflow. Never import from a
// "use client" component — it pulls in the MySQL pool.
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type { ApprovalState, Position, SystemRole } from "@/lib/types";

type Db = Pool | PoolConnection;

export const APPROVAL_SELECT = `
  a.id, a.perf_kpi_id AS perfKpiId, a.record_id AS recordId, a.committee_id AS committeeId,
  a.year_no AS yearNo, a.quarter_no AS quarterNo, a.state,
  a.submitted_by AS submittedBy, a.submitted_at AS submittedAt,
  a.forwarded_by AS forwardedBy, a.forwarded_at AS forwardedAt,
  a.approved_by AS approvedBy, a.approved_at AS approvedAt
`;

/** The approval state for a KPI's quarter. Missing row ⇒ "draft" (implicit). */
export async function getApprovalState(
  db: Db,
  perfKpiId: number | string,
  yearNo: number,
  quarterNo: number,
): Promise<ApprovalState> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT state FROM perf_kpi_approval
     WHERE perf_kpi_id = ? AND year_no = ? AND quarter_no = ?`,
    [perfKpiId, yearNo, quarterNo],
  );
  return (rows[0]?.state as ApprovalState) ?? "draft";
}

/** The actor's app-level system role, straight from the DB. Absent or unknown
 *  faculty ⇒ "viewer", the least-privileged role. Never derived from the
 *  request body: the client used to supply its own `userRole`, which let any
 *  caller claim admin. */
export async function resolveSystemRole(
  db: Db,
  facultyId: string | null,
): Promise<SystemRole> {
  if (!facultyId) return "viewer";
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT system_role FROM faculty WHERE id = ?`,
    [facultyId],
  );
  // Only the admin bit matters to the approval workflow (it grants `reverse`);
  // the other three roles are equivalent here, so they collapse to the floor.
  return rows[0]?.system_role === "admin" ? "admin" : "viewer";
}

/** Resolve a person's committee position for a specific committee, or null. */
export async function resolvePosition(
  db: Db,
  facultyId: string,
  committeeId: string | null,
): Promise<Position | null> {
  if (!facultyId || !committeeId) return null;
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT position FROM committee_memberships
     WHERE faculty_id = ? AND committee_id = ?`,
    [facultyId, committeeId],
  );
  if (rows[0]?.position) return rows[0].position as Position;

  const [committeeRows] = await db.query<RowDataPacket[]>(
    `SELECT 1 FROM committee_memberships WHERE committee_id = ? LIMIT 1`,
    [committeeId],
  );
  if (committeeRows.length > 0) return null;

  const [actorRows] = await db.query<RowDataPacket[]>(
    `SELECT position FROM committee_memberships WHERE faculty_id = ?`,
    [facultyId],
  );
  return actorRows.length === 1 ? (actorRows[0].position as Position) : null;
}
