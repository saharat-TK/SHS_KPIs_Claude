"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Role, User } from "@/lib/types";
import { can, type Action, type ResourceCtx } from "./can";

// Phase 1: mock users, one per role, with a dev role-switcher in the top bar.
// Phase 2 replaces this provider with real auth + session-derived roles.
export const MOCK_USERS: Record<Role, User> = {
  admin: {
    id: "u-admin",
    name: "Dr. Anchali Wong",
    email: "admin@mfu.ac.th",
    role: "admin",
  },
  reviewer: {
    id: "u-reviewer",
    name: "Dr. Krit Saetang",
    email: "reviewer@mfu.ac.th",
    role: "reviewer",
  },
  committee: {
    id: "u-committee",
    name: "Dr. Nida Phuwadol",
    email: "committee.lead@mfu.ac.th",
    role: "committee",
    committeeId: "cmt-curriculum",
  },
  viewer: {
    id: "u-viewer",
    name: "Somchai P.",
    email: "viewer@mfu.ac.th",
    role: "viewer",
  },
};

interface AuthValue {
  user: User;
  role: Role;
  setRole: (role: Role) => void;
  can: (action: Action, resource?: ResourceCtx) => boolean;
}

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  const user = MOCK_USERS[role];

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role,
      setRole,
      can: (action, resource) => can(user, action, resource),
    }),
    [user, role],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
