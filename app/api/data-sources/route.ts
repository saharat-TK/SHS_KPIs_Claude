import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { DATA_SOURCE_FROM, DATA_SOURCE_SELECT } from "@/lib/kpi/dataSourcesServer";
import {
  requireActor,
  requirePermission,
  actorErrorResponse,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireActor();
    const committeeId = req.nextUrl.searchParams.get("committeeId");
    const status = req.nextUrl.searchParams.get("status");

    const where: string[] = [];
    const values: unknown[] = [];
    if (committeeId) {
      where.push("d.committee_id = ?");
      values.push(committeeId);
    }
    if (status) {
      where.push("d.status = ?");
      values.push(status);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${DATA_SOURCE_SELECT} ${DATA_SOURCE_FROM}
       ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY d.name`,
      values,
    );
    return NextResponse.json(rows);
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to load data sources" },
        { status: 500 },
      )
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission("configure_kpis");
    const b = await req.json();
    const name = (b.name as string)?.trim();
    if (!name) {
      return NextResponse.json({ error: "A name is required" }, { status: 400 });
    }
    if (!b.committeeId) {
      return NextResponse.json({ error: "A committee is required" }, { status: 400 });
    }
    const periodGrain = b.periodGrain === "annual" ? "annual" : "quarterly";

    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO data_source (name, description, committee_id, period_grain, status, created_by)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [
        name,
        b.description?.trim() || null,
        b.committeeId,
        periodGrain,
        actor.facultyId,
      ],
    );

    const [created] = await pool.query<RowDataPacket[]>(
      `SELECT ${DATA_SOURCE_SELECT} ${DATA_SOURCE_FROM} WHERE d.id = ?`,
      [ins.insertId],
    );
    return NextResponse.json(created[0], { status: 201 });
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to create data source" },
        { status: 500 },
      )
    );
  }
}
