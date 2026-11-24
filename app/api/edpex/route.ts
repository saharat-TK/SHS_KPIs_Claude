// The EdPEx topic → area catalog, read by every KPI form, the batch grid, the
// KPI info pop-up and the dashboard. Writes live under ./topics and ./areas.
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import { loadEdpexCatalog } from "@/lib/kpi/edpexServer";
import { requireActor, actorErrorResponse } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireActor();
    return NextResponse.json(await loadEdpexCatalog(pool));
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load EdPEx topics" },
      { status: 500 },
    );
  }
}
