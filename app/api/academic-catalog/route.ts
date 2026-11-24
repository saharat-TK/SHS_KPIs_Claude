import { NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import { loadAcademicCatalog } from "@/lib/kpi/academicCatalogServer";
import { requireActor, actorErrorResponse } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** The one read-only source for client program/curriculum pickers and batches. */
export async function GET() {
  try {
    await requireActor();
    return NextResponse.json(await loadAcademicCatalog(pool));
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load academic catalog" },
      { status: 500 },
    );
  }
}
