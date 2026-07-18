import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  LINK_FROM,
  LINK_SELECT,
  errorResponse,
  mapLinkRow,
  validateLinkMappings,
} from "@/lib/kpi/dataSourcesServer";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LINK_SELECT} ${LINK_FROM}
        WHERE l.data_source_id = ?
        ORDER BY s.start_year DESC, k.sort_order, m.sort_order, l.id`,
      [params.id],
    );
    return NextResponse.json(rows.map(mapLinkRow));
  } catch (err) {
    return errorResponse(err, "Failed to load links");
  }
}

/** Link a data source to exactly one library KPI or metric. `mappings` says which
 *  rows produce the target's value (decision D3); an empty list keeps the link as
 *  evidence only. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const b = await req.json();
    const libraryKpiId = b.libraryKpiId ? Number(b.libraryKpiId) : null;
    const libraryMetricId = b.libraryMetricId ? Number(b.libraryMetricId) : null;

    if ((libraryKpiId === null) === (libraryMetricId === null)) {
      return NextResponse.json(
        { error: "Link exactly one KPI or one metric" },
        { status: 400 },
      );
    }

    // Authoritative regardless of what the UI offered.
    const mappings = await validateLinkMappings(pool, params.id, b.mappings);

    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO data_source_link
         (data_source_id, library_kpi_id, library_metric_id, mappings, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        params.id,
        libraryKpiId,
        libraryMetricId,
        mappings.length > 0 ? JSON.stringify(mappings) : null,
        b.note?.trim() || null,
      ],
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LINK_SELECT} ${LINK_FROM} WHERE l.id = ?`,
      [ins.insertId],
    );
    return NextResponse.json(mapLinkRow(rows[0]), { status: 201 });
  } catch (err) {
    // uq_ds_link (data_source_id, target_key) — the same target twice.
    if (err instanceof Error && "code" in err && err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "This data source is already linked to that KPI or metric" },
        { status: 409 },
      );
    }
    return errorResponse(err, "Failed to link data source");
  }
}
