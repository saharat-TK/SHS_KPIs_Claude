import NextAuth from "next-auth";
import { NextResponse } from "next/server";
// The EDGE-SAFE half only. Importing lib/auth/auth here would pull mysql2 into
// the edge bundle and break the build — see lib/auth/auth.config.ts.
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * A coarse gate: is there a validly signed session cookie? That is all the
 * edge runtime can answer without a database.
 *
 * It deliberately does not check roles, and cannot tell that a signed-in
 * person has since been deactivated — the (app) layout and each route's
 * requireActor()/requirePermission() cover those.
 */
export default auth((req) => {
  if (req.auth) return;

  const { pathname, search } = req.nextUrl;

  // API callers get JSON. Redirecting them to an HTML login page would hand
  // fetch() a document to choke on instead of a readable error.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: [
    // Everything except Auth.js's own endpoints, the login page itself, Next
    // internals, and public static files.
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)",
  ],
};
