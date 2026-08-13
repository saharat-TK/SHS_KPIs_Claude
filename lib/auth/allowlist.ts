import type { Role } from "@/lib/types";

// Pure, dependency-free helpers shared by the sign-in callback and the session
// resolver. Kept apart from auth.ts and session.ts precisely so the unit tests
// can import them without dragging in mysql2 or next-auth.

/** Lower-cases and trims, matching how faculty.email is stored (see
 *  scripts/migrate-app-roles.mjs phase 4). Returns null for anything that
 *  isn't a plausible address, so callers can fail closed on one check. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.includes("@") ? email : null;
}

/** Note the "@" in the comparison: a bare endsWith(domain) would also accept
 *  someone@evil-mfu.ac.th, which is a different organisation entirely. */
export function isAllowedDomain(email: string, domain: string): boolean {
  return email.endsWith(`@${domain.trim().toLowerCase()}`);
}

/** A faculty row as far as authentication cares about it. */
export interface ActorRow {
  facultyId: string;
  name: string;
  email: string;
  role: Role;
  committeeId: string | null;
}

export interface SessionActor extends ActorRow {
  /** True when an admin is viewing the app as someone else. */
  impersonating: boolean;
  /** The person actually signed in. Audit trails must record this one. */
  realFacultyId: string;
  realName: string;
  realRole: Role;
}

/**
 * Decides which identity a request runs as, given the signed-in row and an
 * optional impersonation target. Split out from getSessionActor so the rules
 * below are testable without a database.
 *
 * The impersonation cookie is a *pointer*, never a grant: this function
 * re-checks that the real row is an admin every time, which is what makes it
 * safe for that cookie to be forgeable. Forging it as a non-admin is a no-op.
 */
export function resolveActor(input: {
  real: ActorRow | null;
  impersonateTarget: ActorRow | null;
}): SessionActor | null {
  const { real, impersonateTarget } = input;
  if (!real) return null;

  const self = {
    ...real,
    impersonating: false,
    realFacultyId: real.facultyId,
    realName: real.name,
    realRole: real.role,
  };

  if (!impersonateTarget) return self;
  if (real.role !== "admin") return self;
  // Impersonating yourself is not impersonation — don't raise the banner.
  if (impersonateTarget.facultyId === real.facultyId) return self;

  return {
    ...impersonateTarget,
    impersonating: true,
    realFacultyId: real.facultyId,
    realName: real.name,
    realRole: real.role,
  };
}
