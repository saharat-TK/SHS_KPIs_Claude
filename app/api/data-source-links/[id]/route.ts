import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  LINK_FROM,
  LINK_SELECT,
  errorResponse,
  mapLinkRow,
  validateLinkMappings,
} from "@/lib/kpi/dataSourcesServer";

export const dynamic = "force-dynamic";

/** Edit a link's mappings or note. The target KPI/metric is immutable — changing
 *  it is a different link, and the unique key is built on it. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const b = await req.json();

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT data_source_id AS dataSourceId FROM data_source_link WHERE id = ?",
      [params.id],
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if ("mappings" in b) {
      const mappings = await validateLinkMappings(
        pool,
        existing[0].dataSourceId,
        b.mappings,
      );
      setClauses.push("mappings = ?");
      values.push(mappings.length > 0 ? JSON.stringify(mappings) : null);
    }
    if ("note" in b) {
      setClauses.push("note = ?");
      values.push(b.note?.trim() || null);
    }
    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(params.id);

    await pool.query<ResultSetHeader>(
      `UPDATE data_source_link SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LINK_SELECT} ${LINK_FROM} WHERE l.id = ?`,
      [params.id],
    );
    return NextResponse.json(mapLinkRow(rows[0]));
  } catch (err) {
    return errorResponse(err, "Failed to update link");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM data_source_link WHERE id = ?",
      [params.id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return errorResponse(err, "Failed to remove link");
  }
}
