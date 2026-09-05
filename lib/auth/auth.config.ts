import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { BASE_PATH } from "@/lib/basePath";

// ─────────────────────────────────────────────────────────────────────────────
//  EDGE-SAFE HALF OF THE AUTH CONFIG — DO NOT IMPORT A DATABASE HERE.
//
//  middleware.ts builds its own NextAuth instance from this object alone,
//  and middleware runs on the edge runtime. mysql2 needs node:net/node:tls,
//  so the moment anything reachable from this file imports lib/db/mysql the
//  build breaks. The faculty lookup and every other DB-backed callback lives
//  in ./auth.ts, which is Node-only.
//
//  If you find yourself wanting to check a role in middleware: don't. Do it in
//  the route via requireActor()/requirePermission() from ./session.ts.
// ─────────────────────────────────────────────────────────────────────────────

export const ALLOWED_DOMAIN = process.env.AUTH_ALLOWED_DOMAIN ?? "mfu.ac.th";

export const authConfig = {
  basePath: `${BASE_PATH}/api/auth`,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          // `hd` only tells Google's account chooser which domain to prefer.
          // A client can strip it, so it is a convenience, never a control —
          // the real gate is the signIn callback in ./auth.ts.
          hd: ALLOWED_DOMAIN,
          prompt: "select_account",
          scope: "openid email profile",
        },
      },
    }),
  ],

  // No database adapter: the session is a signed JWT cookie. Identity is
  // stamped into it at sign-in; authority is re-read from the faculty table on
  // every request (see getSessionActor), so a role change takes effect at once
  // rather than waiting out the token.
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },

  // Both point at the same route — one page renders the sign-in button and the
  // rejection copy, keyed off ?error=.
  pages: { signIn: `${BASE_PATH}/login`, error: `${BASE_PATH}/login` },

  trustHost: true,

  callbacks: {
    // Consumed by middleware. Deliberately coarse: "is there a valid session",
    // nothing more. No DB, no roles.
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    async redirect({ url, baseUrl }) {
      const appBase = `${baseUrl}${BASE_PATH}`;
      if (url.startsWith("/")) {
        if (BASE_PATH && url.startsWith(BASE_PATH)) return `${baseUrl}${url}`;
        return `${appBase}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        if (url.startsWith(appBase)) return url;
        return url.replace(baseUrl, appBase);
      }
      return `${appBase}/dashboard`;
    },
  },
} satisfies NextAuthConfig;
