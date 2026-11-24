import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import { loadCommitteeUsage } from "@/lib/kpi/committeeServer";
import { requireActor, actorErrorResponse } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// What is attached to a committee, so the UI can disable Delete and say why
// before the user clicks. The DELETE route re-checks this itself.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireActor();
    return NextResponse.json(await loadCommitteeUsage(pool, params.id));
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load committee usage" },
      { status: 500 },
    );
  }
}
