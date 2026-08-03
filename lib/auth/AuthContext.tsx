"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Role, User } from "@/lib/types";
import { can, type Action, type ResourceCtx } from "./can";

// Phase 1: mock personas with a dev switcher in the top bar. Phase 2 replaces
// this provider with real auth + session-derived roles.
//
// The performance-approval workflow resolves a person's stage (member / lead /
// counselor) from their committee_memberships.position, keyed by faculty.id — so
// each persona carries a real `facultyId` from the seeded DB. Three committee
// personas share role "committee" but map to different positions in
// cmt-curriculum, making the whole member→lead→counselor chain demoable.
export interface Persona extends User {
  personaId: string;
  /** Short description shown in the switcher (e.g. the committee position). */
  hint?: string;
}

export const PERSONAS: Persona[] = [
  {
    personaId: "admin",
    id: "u-admin",
    // Seeded by scripts/migrate-admin-system-role.mjs with system_role='admin'.
    // The API resolves admin authority from that DB row, so the persona needs a
    // real facultyId to send as actorId — without it, reverse is refused.
    facultyId: "fac-000",
    name: "Dr. Anchali Wong",
    email: "admin@mfu.ac.th",
    role: "admin",
    hint: "Administrator · can reverse locked records",
  },
  {
    personaId: "committee-member",
    id: "u-fac-002",
    facultyId: "fac-002",
    name: "ผศ.ดร.จงกล สายสิงห์",
    email: "jongkon.sai@mfu.ac.th",
    role: "committee",
    committeeId: "cmt-curriculum",
    hint: "Committee member · records & submits",
  },
  {
    personaId: "committee-secretary",
    id: "u-fac-042",
    facultyId: "fac-042",
    name: "อ.รติภาคย์ ตามรภาค",
    email: "ratipark.tam@mfu.ac.th",
    role: "committee",
    committeeId: "cmt-curriculum",
    hint: "Committee and Secretary · records & submits",
  },
  {
    personaId: "committee-lead",
    id: "u-fac-022",
    facultyId: "fac-022",
    name: "อ.ดร.สหรัตถ์ อารีราษฎร์",
    email: "saharat.arr@mfu.ac.th",
    role: "committee",
    committeeId: "cmt-curriculum",
    hint: "Committee Lead · edits, sends back, forwards · also has admin rights",
  },
  {
    personaId: "committee-counselor",
    id: "u-fac-003",
    facultyId: "fac-003",
    name: "ผศ.ดร.วิภพ สุทธนะ",
    email: "wipob.sut@mfu.ac.th",
    role: "committee",
    committeeId: "cmt-curriculum",
    hint: "Counselor · final approval",
  },
  {
    personaId: "reviewer",
    id: "u-reviewer",
    name: "Dr. Krit Saetang",
    email: "reviewer@mfu.ac.th",
    role: "reviewer",
    hint: "Reviewer · validation queue",
  },
  {
    personaId: "viewer",
    id: "u-viewer",
    name: "Somchai P.",
    email: "viewer@mfu.ac.th",
    role: "viewer",
    hint: "Viewer · read-only",
  },
];

// Back-compat: one representative user per role (first persona with that role).
export const MOCK_USERS: Record<Role, User> = {
  admin: PERSONAS.find((p) => p.role === "admin")!,
  reviewer: PERSONAS.find((p) => p.role === "reviewer")!,
  committee: PERSONAS.find((p) => p.role === "committee")!,
  viewer: PERSONAS.find((p) => p.role === "viewer")!,
};

interface AuthValue {
  user: User;
  role: Role;
  personaId: string;
  personas: Persona[];
  setPersona: (personaId: string) => void;
  /** Back-compat: switch to the first persona with the given role. */
  setRole: (role: Role) => void;
  can: (action: Action, resource?: ResourceCtx) => boolean;
}

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaId] = useState<string>("admin");
  const persona =
    PERSONAS.find((p) => p.personaId === personaId) ?? PERSONAS[0];

  const value = useMemo<AuthValue>(
    () => ({
      user: persona,
      role: persona.role,
      personaId: persona.personaId,
      personas: PERSONAS,
      setPersona: setPersonaId,
      setRole: (r) => {
        const next = PERSONAS.find((p) => p.role === r);
        if (next) setPersonaId(next.personaId);
      },
      can: (action, resource) => can(persona, action, resource),
    }),
    [persona],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
