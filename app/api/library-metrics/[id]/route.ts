import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { LIBRARY_METRIC_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

const COLUMN_MAP: Record<string, string> = {
  name: "name",
  description: "description",
  categoryId: "category_id",
  dataCollectMethod: "data_collect_method",
  collectionPeriod: "collection_period",
  dataSourceUrl: "data_source_url",
  committeeId: "committee_id",
  personInChargeId: "person_in_charge_id",
  weight: "weight",
  unit: "unit",
  fiveYearTarget: "five_year_target",
  thresholdGreen: "threshold_green",
  thresholdAmber: "threshold_amber",
  sortOrder: "sort_order",
};

const NULLABLE_TEXT = new Set([
  "description",
  "dataCollectMethod",
  "dataSourceUrl",
  "unit",
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
      `SELECT ${LIBRARY_METRIC_FIELDS} FROM library_metric m WHERE m.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }
    const [targets] = await pool.query<RowDataPacket[]>(
      "SELECT year_no AS yearNo, target_value AS targetValue FROM library_metric_annual_target WHERE metric_id = ? ORDER BY year_no",
      [params.id],
    );
    return NextResponse.json({ ...rows[0], annualTargets: targets });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load metric" },
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
      `UPDATE library_metric SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LIBRARY_METRIC_FIELDS} FROM library_metric m WHERE m.id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update metric" },
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
      "DELETE FROM library_metric WHERE id = ?",
      [params.id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete metric" },
      { status: 500 },
    );
  }
}
