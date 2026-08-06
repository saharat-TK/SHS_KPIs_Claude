import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, kpi_type_name AS kpiTypeName, sort_order AS sortOrder, " +
  "applies_to_categories AS appliesToCategories";

// Read-only reference data — the three rows are seeded by
// scripts/migrate-kpi-type-table.mjs and there is no UI to edit them.
export async function GET(req: NextRequest) {
  try {
    // ?forCategories=1 narrows to the types a CATEGORY may be classified as
    // (Strategic / Routine). Operational applies to KPIs only.
    const forCategories = req.nextUrl.searchParams.get("forCategories");
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM kpi_type
        ${forCategories ? "WHERE applies_to_categories = 1" : ""}
        ORDER BY sort_order, id`,
    );
    return NextResponse.json(
      rows.map((r) => ({ ...r, appliesToCategories: Boolean(r.appliesToCategories) })),
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load KPI types" },
      { status: 500 },
    );
  }
}
