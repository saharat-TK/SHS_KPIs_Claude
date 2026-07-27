import { NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import { loadAcademicCatalog } from "@/lib/kpi/academicCatalogServer";

export const dynamic = "force-dynamic";

/** The one read-only source for client program/curriculum pickers and batches. */
export async function GET() {
  try {
    return NextResponse.json(await loadAcademicCatalog(pool));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load academic catalog" },
      { status: 500 },
    );
  }
}
