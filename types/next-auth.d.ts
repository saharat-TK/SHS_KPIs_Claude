import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/types";

// Adds the two app-specific claims to Auth.js's own types. Picked up
// automatically: tsconfig's include is "**/*.ts".

declare module "next-auth" {
  interface Session {
    user: {
      /** faculty.id, or null if the row vanished between sign-in and now. */
      facultyId: string | null;
      /** Display only, and possibly stale — authorize via getSessionActor(). */
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    facultyId?: string | null;
    role?: Role;
  }
}

export {};
