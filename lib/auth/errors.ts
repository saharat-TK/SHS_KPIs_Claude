import { NextResponse } from "next/server";

// Kept apart from ./session.ts so a module can turn an auth failure into a
// response without pulling next-auth and the MySQL pool into its import graph.

/** Thrown by requireActor()/requirePermission(). */
export class ActorError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ActorError";
  }
}

/** Call first in a route's catch block; returns null for unrelated errors so
 *  the existing handling still deals with those. */
export function actorErrorResponse(err: unknown): NextResponse | null {
  return err instanceof ActorError
    ? NextResponse.json({ error: err.message }, { status: err.status })
    : null;
}
