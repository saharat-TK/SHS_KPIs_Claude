"use client";

import { createContext, useContext, useMemo } from "react";
import type { Role, User } from "@/lib/types";
import { can, type Action, type ResourceCtx } from "./can";

// The signed-in identity, as resolved on the server by getSessionActor() and
// handed down through app/(app)/layout.tsx. This used to be a hardcoded
// persona list with a demo switcher; the switcher survives only as the
// admin-only "View as" in components/shell/UserMenu.tsx, which round-trips
// through the server rather than flipping state here.
//
// `user`, `role` and `can` keep the exact shapes they had, so every existing
// useAuth() call site is unaffected.

interface AuthValue {
  user: User;
  role: Role;
  can: (action: Action, resource?: ResourceCtx) => boolean;
  /** An admin is currently viewing the app as someone else. */
  impersonating: boolean;
  /** The person actually signed in — shown in the impersonation banner. */
  realName: string;
  /** Whether the *real* signed-in person is an admin. Not the same as
   *  `role === "admin"` while impersonating someone less privileged. */
  isRealAdmin: boolean;
}

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
  impersonating,
  realName,
  isRealAdmin,
}: {
  children: React.ReactNode;
  initialUser: User;
  impersonating: boolean;
  realName: string;
  isRealAdmin: boolean;
}) {
  const value = useMemo<AuthValue>(
    () => ({
      user: initialUser,
      role: initialUser.role,
      can: (action, resource) => can(initialUser, action, resource),
      impersonating,
      realName,
      isRealAdmin,
    }),
    [initialUser, impersonating, realName, isRealAdmin],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
