import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/lib/db/mysql";
import { auth } from "@/lib/auth/auth";
import { IMPERSONATE_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reads the *raw* signed-in row, deliberately not via getSessionActor(),
 *  which would already have applied any existing impersonation cookie. Going
 *  through it here would let an admin impersonate an admin and chain onward
 *  from there; this way the check always lands on the real person. */
async function realSignedInFaculty() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return null;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, system_role AS role FROM faculty
      WHERE LOWER(TRIM(email)) = ? AND status = 'active' LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

/** POST { facultyId } — start viewing the app as someone else. Admin only. */
export async function POST(req: NextRequest) {
  try {
    const real = await realSignedInFaculty();
    if (!real) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    if (real.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const facultyId = typeof body?.facultyId === "string" ? body.facultyId : null;
    if (!facultyId) {
      return NextResponse.json({ error: "facultyId is required" }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM faculty WHERE id = ? AND status = 'active' LIMIT 1`,
      [facultyId],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Unknown faculty member" }, { status: 404 });
    }

    cookies().set(IMPERSONATE_COOKIE, facultyId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      // Shorter than the session on purpose: an admin who wanders off drops
      // back to their own identity rather than staying someone else all day.
      maxAge: 60 * 60,
    });
    return NextResponse.json({ ok: true, facultyId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to impersonate" },
      { status: 500 },
    );
  }
}

/** DELETE — stop impersonating. No role check: clearing only ever gives up
 *  privilege, and a stale cookie should always be removable. */
export async function DELETE() {
  cookies().delete(IMPERSONATE_COOKIE);
  return NextResponse.json({ ok: true });
}
