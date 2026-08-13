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
import { requireActor } from "@/lib/auth/session";
import { normalizeEntryPeriod, validateEntryValues } from "@/lib/kpi/dataSources";
import { feedFromDataSource } from "@/lib/kpi/dataSourceFeed";

export const dynamic = "force-dynamic";

/** The owning source of an entry, or null when the entry doesn't exist. */
async function sourceForEntry(entryId: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT data_source_id AS dataSourceId FROM data_source_entry WHERE id = ?",
    [entryId],
  );
  if (rows.length === 0) return null;
  return loadSourceShape(pool, rows[0].dataSourceId);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requireActor();
    const b = await req.json();

    const source = await sourceForEntry(params.id);
    if (!source) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const denied = await checkEntryWriteAccess(
      pool,
      source,
      actor.facultyId,
      actor.role,
    );
    if (denied) return NextResponse.json({ error: denied }, { status: 403 });

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if ("year" in b || "quarter" in b) {
      const period = normalizeEntryPeriod(source.periodGrain, b.year, b.quarter);
      setClauses.push("year = ?", "quarter = ?");
      values.push(period.year, period.quarter);
    }
    if ("values" in b) {
      const columns = await resolveColumnOptions(pool, source.columns);
      setClauses.push("values_json = ?");
      values.push(JSON.stringify(validateEntryValues(columns, b.values ?? {})));
    }
    if ("note" in b) {
      setClauses.push("note = ?");
      values.push(b.note?.trim() || null);
    }
    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(params.id);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query<ResultSetHeader>(
        `UPDATE data_source_entry SET ${setClauses.join(", ")} WHERE id = ?`,
        values,
      );
      await feedFromDataSource(conn, source.id);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${ENTRY_SELECT} ${ENTRY_FROM} WHERE e.id = ?`,
      [params.id],
    );
    return NextResponse.json(mapEntryRow(rows[0]));
  } catch (err) {
    return errorResponse(err, "Failed to update entry");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requireActor();

    const source = await sourceForEntry(params.id);
    if (!source) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const denied = await checkEntryWriteAccess(
      pool,
      source,
      actor.facultyId,
      actor.role,
    );
    if (denied) return NextResponse.json({ error: denied }, { status: 403 });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query<ResultSetHeader>(
        "DELETE FROM data_source_entry WHERE id = ?",
        [params.id],
      );
      if (result.affectedRows === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
      }
      // Removing a row changes what the KPIs it fed should say.
      await feedFromDataSource(conn, source.id);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return errorResponse(err, "Failed to delete entry");
  }
}
