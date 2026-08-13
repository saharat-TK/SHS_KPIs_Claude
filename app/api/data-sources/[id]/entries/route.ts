import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  ENTRY_FROM,
  ENTRY_SELECT,
  checkEntryWriteAccess,
  errorResponse,
  loadSourceShape,
  mapEntryRow,
  resolveColumnOptions,
} from "@/lib/kpi/dataSourcesServer";
import { normalizeEntryPeriod, validateEntryValues } from "@/lib/kpi/dataSources";
import { feedFromDataSource } from "@/lib/kpi/dataSourceFeed";
import { requireActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireActor();
    const year = req.nextUrl.searchParams.get("year");
    const quarter = req.nextUrl.searchParams.get("quarter");

    const where = ["e.data_source_id = ?"];
    const values: unknown[] = [params.id];
    if (year) {
      where.push("e.year = ?");
      values.push(Number(year));
    }
    if (quarter) {
      where.push("e.quarter = ?");
      values.push(Number(quarter));
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${ENTRY_SELECT} ${ENTRY_FROM}
        WHERE ${where.join(" AND ")}
        ORDER BY e.year DESC, e.quarter DESC, e.id DESC`,
      values,
    );
    return NextResponse.json(rows.map(mapEntryRow));
  } catch (err) {
    return errorResponse(err, "Failed to load entries");
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requireActor();
    const b = await req.json();

    const source = await loadSourceShape(pool, params.id);
    if (!source) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }
    if (source.columns.length === 0) {
      return NextResponse.json(
        { error: "Define this data source's columns before recording data" },
        { status: 409 },
      );
    }

    const denied = await checkEntryWriteAccess(
      pool,
      source,
      actor.facultyId,
      actor.role,
    );
    if (denied) return NextResponse.json({ error: denied }, { status: 403 });

    const { year, quarter } = normalizeEntryPeriod(
      source.periodGrain,
      b.year,
      b.quarter,
    );
    const columns = await resolveColumnOptions(pool, source.columns);
    const values = validateEntryValues(columns, b.values ?? {});

    // Write and re-feed in one transaction: a feed failure must not leave the
    // entry saved but the KPIs it feeds stale.
    const conn = await pool.getConnection();
    let insertId: number;
    try {
      await conn.beginTransaction();
      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO data_source_entry
           (data_source_id, year, quarter, values_json, note, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          params.id,
          year,
          quarter,
          JSON.stringify(values),
          b.note?.trim() || null,
          actor.facultyId,
        ],
      );
      insertId = ins.insertId;
      await feedFromDataSource(conn, Number(params.id));
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${ENTRY_SELECT} ${ENTRY_FROM} WHERE e.id = ?`,
      [insertId],
    );
    return NextResponse.json(mapEntryRow(rows[0]), { status: 201 });
  } catch (err) {
    return errorResponse(err, "Failed to record entry");
  }
}
