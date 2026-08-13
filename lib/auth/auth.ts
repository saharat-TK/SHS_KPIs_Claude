import NextAuth from "next-auth";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/lib/db/mysql";
import type { Role } from "@/lib/types";
import { authConfig, ALLOWED_DOMAIN } from "./auth.config";
import { normalizeEmail, isAllowedDomain } from "./allowlist";

// ─────────────────────────────────────────────────────────────────────────────
//  NODE-ONLY. This module imports mysql2 and must never be reachable from
//  middleware.ts — see the header of ./auth.config.ts for why.
// ─────────────────────────────────────────────────────────────────────────────

interface SignInRow {
  id: string;
  name: string;
  systemRole: Role;
}

/** The one query that decides whether an email may sign in at all. Only
 *  `active` rows count: deactivating someone in Faculty Management is how you
 *  revoke their access. */
async function activeFacultyByEmail(email: string): Promise<SignInRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, system_role AS systemRole
       FROM faculty
      WHERE LOWER(TRIM(email)) = ? AND status = 'active'
      LIMIT 1`,
    [email],
  );
  return (rows[0] as SignInRow | undefined) ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    /**
     * The allowlist. There is no auto-provisioning: an mfu.ac.th address that
     * isn't on the faculty roster is refused, and returning false sends the
     * browser to /login?error=AccessDenied.
     *
     * Three independent checks, all required. `hd` on the authorization URL is
     * only a hint to Google's account chooser, so the domain is verified again
     * here against the token Google actually returned.
     */
    async signIn({ profile }) {
      if (profile?.email_verified !== true) return false;

      const email = normalizeEmail(profile.email);
      if (!email) return false;
      if (!isAllowedDomain(email, ALLOWED_DOMAIN)) return false;

      return (await activeFacultyByEmail(email)) !== null;
    },

    /**
     * The token carries *identity* — which faculty row this is. It is stamped
     * once at sign-in and then left alone.
     *
     * `role` rides along only so the client has something to render
     * immediately; it can be up to `maxAge` stale. getSessionActor() re-reads
     * the role from the database per request and is the sole authority. No
     * route may authorize off session.user.role.
     */
    async jwt({ token, profile, trigger }) {
      if (profile?.email || trigger === "signIn") {
        const email = normalizeEmail(profile?.email ?? token.email);
        const row = email ? await activeFacultyByEmail(email) : null;

        token.email = email ?? token.email;
        token.facultyId = row?.id ?? null;
        token.name = row?.name ?? token.name;
        token.role = row?.systemRole ?? "viewer";
      }
      return token;
    },

    // The casts are unavoidable for now: next-auth v5 beta types this
    // callback's `token` across both the JWT and database-session strategies,
    // so the next-auth/jwt module augmentation that applies in jwt() above
    // doesn't narrow here. The claims are written in jwt(); this only forwards
    // them.
    async session({ session, token }) {
      session.user.facultyId = (token.facultyId as string | null) ?? null;
      session.user.role = (token.role as Role | undefined) ?? "viewer";
      if (typeof token.email === "string") session.user.email = token.email;
      return session;
    },
  },
});
