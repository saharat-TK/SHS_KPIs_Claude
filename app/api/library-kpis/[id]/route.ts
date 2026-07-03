import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { LIBRARY_KPI_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

// TS field -> DB column for dynamic PATCH. set_id is immutable.
const COLUMN_MAP: Record<string, string> = {
  name: "name",
  description: "description",
  categoryId: "category_id",
  kpiType: "kpi_type",
  dataCollectMethod: "data_collect_method",
  collectionPeriod: "collection_period",
  dataSourceUrl: "data_source_url",
  committeeId: "committee_id",
  personInChargeId: "person_in_charge_id",
  weight: "weight",
  unit: "unit",
  fiveYearTarget: "five_year_target",
  calculationType: "calculation_type",
  calculationLogic: "calculation_logic",
  formulaId: "formula_id",
  thresholdGreen: "threshold_green",
  thresholdAmber: "threshold_amber",
  sortOrder: "sort_order",
};

// Columns that are nullable text — blank/whitespace collapses to NULL.
const NULLABLE_TEXT = new Set([
  "description",
  "dataCollectMethod",
  "dataSourceUrl",
  "unit",
  "calculationLogic",
  "categoryId",
  "committeeId",
  "personInChargeId",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LIBRARY_KPI_FIELDS} FROM library_kpi k WHERE k.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }
    const [targets] = await pool.query<RowDataPacket[]>(
      "SELECT year_no AS yearNo, target_value AS targetValue FROM library_kpi_annual_target WHERE kpi_id = ? ORDER BY year_no",
      [params.id],
    );
    return NextResponse.json({ ...rows[0], annualTargets: targets });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load KPI" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const setClauses: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(COLUMN_MAP)) {
      if (key in body) {
        setClauses.push(`${column} = ?`);
        const v = body[key];
        values.push(
          NULLABLE_TEXT.has(key)
            ? (typeof v === "string" ? v.trim() : v) || null
            : v,
        );
      }
    }
    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(params.id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE library_kpi SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LIBRARY_KPI_FIELDS} FROM library_kpi k WHERE k.id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update KPI" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM library_kpi WHERE id = ?",
      [params.id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete KPI" },
      { status: 500 },
    );
  }
}
