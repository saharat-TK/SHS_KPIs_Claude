import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/lib/db/mysql";
import { auth } from "./auth";
import { can, type Action, type ResourceCtx } from "./can";
import { ActorError } from "./errors";
import { resolveActor, type ActorRow, type SessionActor } from "./allowlist";

export type { SessionActor } from "./allowlist";
export { ActorError, actorErrorResponse } from "./errors";

/**
 * Names the faculty row a request runs as while an admin is using "View as".
 *
 * Deliberately a plain cookie rather than a signed JWT claim. It is forgeable,
 * and that is fine: resolveActor() re-reads the *real* signed-in row's admin
 * bit from the database on every request and ignores this cookie unless that
 * bit is set. Forging it as a non-admin achieves nothing.
 *
 * Do not "harden" this into a signed claim without also reading resolveActor —
 * the safety here comes from the server-side recheck, not from the cookie.
 */
export const IMPERSONATE_COOKIE = "shs-impersonate";

// A person can sit on several committees; this single id exists only for
// can()'s committee scoping and for display. The approval workflow resolves
// position against the KPI's own committee via resolvePosition(), which is
// unaffected by which one we pick here.
const ACTOR_SELECT = `
  f.id                AS facultyId,
  f.name              AS name,
  f.email             AS email,
  f.system_role       AS role,
  (SELECT cm.committee_id FROM committee_memberships cm
    WHERE cm.faculty_id = f.id ORDER BY cm.committee_id LIMIT 1) AS committeeId
`;

async function activeFacultyById(id: string): Promise<ActorRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${ACTOR_SELECT} FROM faculty f
      WHERE f.id = ? AND f.status = 'active' LIMIT 1`,
    [id],
  );
  return (rows[0] as ActorRow | undefined) ?? null;
}

async function activeFacultyByEmail(email: string): Promise<ActorRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${ACTOR_SELECT} FROM faculty f
      WHERE LOWER(TRIM(f.email)) = ? AND f.status = 'active' LIMIT 1`,
    [email],
  );
  return (rows[0] as ActorRow | undefined) ?? null;
}

/**
 * Who this request runs as — the single authority for identity and authority
 * alike. Returns null when nobody is signed in, or when the signed-in person's
 * faculty row has since been deactivated or deleted (which is why the layout
 * checks this too: middleware only sees the token, not the row).
 *
 * Wrapped in React's cache() so a layout, the page inside it, and any server
 * helper all share one round-trip. cache() is per-request in the App Router,
 * so nothing leaks between users.
 */
export const getSessionActor = cache(
  async (): Promise<SessionActor | null> => {
    const session = await auth();
    const email = session?.user?.email?.trim().toLowerCase();
    if (!email) return null;

    const real = await activeFacultyByEmail(email);
    if (!real) return null;

    const targetId = cookies().get(IMPERSONATE_COOKIE)?.value;
    // Only pay for the second query when it could possibly matter.
    const impersonateTarget =
      targetId && targetId !== real.facultyId && real.role === "admin"
        ? await activeFacultyById(targetId)
        : null;

    return resolveActor({ real, impersonateTarget });
  },
);

/** Route-handler guard: the caller is signed in and still on the roster. */
export async function requireActor(): Promise<SessionActor> {
  const actor = await getSessionActor();
  if (!actor) throw new ActorError(401, "Not signed in");
  return actor;
}

/** As requireActor, plus the same can() policy the UI uses to hide things —
 *  the UI hides, this refuses. */
export async function requirePermission(
  action: Action,
  resource?: ResourceCtx,
): Promise<SessionActor> {
  const actor = await requireActor();
  const allowed = can(
    {
      id: actor.facultyId,
      name: actor.name,
      email: actor.email,
      role: actor.role,
      facultyId: actor.facultyId,
      committeeId: actor.committeeId ?? undefined,
    },
    action,
    resource,
  );
  if (!allowed) {
    throw new ActorError(403, `Your role (${actor.role}) cannot ${action}`);
  }
  return actor;
}

