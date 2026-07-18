import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { DATA_SOURCE_FROM, DATA_SOURCE_SELECT } from "@/lib/kpi/dataSourcesServer";

export const dynamic = "force-dynamic";

const COLUMN_MAP: Record<string, string> = {
  name: "name",
  description: "description",
  committeeId: "committee_id",
  periodGrain: "period_grain",
  status: "status",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${DATA_SOURCE_SELECT} ${DATA_SOURCE_FROM} WHERE d.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load data source" },
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

    // Changing the grain would strand existing entries (a quarterly entry has a
    // quarter an annual source must not have), so only allow it while empty.
    if ("periodGrain" in body) {
      const [entries] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM data_source_entry WHERE data_source_id = ?",
        [params.id],
      );
      if (Number(entries[0].n) > 0) {
        return NextResponse.json(
          { error: "Cannot change the period grain once entries have been recorded" },
          { status: 409 },
        );
      }
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(COLUMN_MAP)) {
      if (key in body) {
        setClauses.push(`${column} = ?`);
        values.push(body[key] === "" ? null : body[key]);
      }
    }
    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(params.id);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE data_source SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${DATA_SOURCE_SELECT} ${DATA_SOURCE_FROM} WHERE d.id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update data source" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Columns, entries and links cascade via FK.
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM data_source WHERE id = ?",
      [params.id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete data source" },
      { status: 500 },
    );
  }
}
