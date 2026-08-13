"use server";

import { cookies } from "next/headers";
import { signOut } from "@/lib/auth/auth";
import { IMPERSONATE_COOKIE } from "@/lib/auth/session";

/**
 * Signing out must also drop any impersonation. Otherwise an admin signs out,
 * someone else signs in on the same browser, and that cookie is still sitting
 * there — inert today, since resolveActor ignores it for non-admins, but a
 * trap the moment anyone relaxes that check.
 */
export async function signOutAction() {
  cookies().delete(IMPERSONATE_COOKIE);
  await signOut({ redirectTo: "/login" });
}
