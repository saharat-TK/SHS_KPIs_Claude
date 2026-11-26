import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { requirePermission, actorErrorResponse, requireActor } from "@/lib/auth/session";
import { deleteBlockReason, startYearLockReason } from "@/lib/kpi/setRules";

export const dynamic = "force-dynamic";

const SELECT_FIELDS = `
  s.id, s.name, s.description,
  s.start_year AS startYear, s.end_year AS endYear, s.status,
  s.cloned_from_set_id AS clonedFromSetId, s.created_by AS createdBy,
  s.created_at AS createdAt, s.updated_at AS updatedAt,
  (SELECT COUNT(*) FROM library_kpi k WHERE k.set_id = s.id) AS kpiCount,
  (SELECT COUNT(*) FROM library_metric m
     JOIN library_kpi mk ON mk.id = m.kpi_id
    WHERE mk.set_id = s.id) AS metricCount,
  (SELECT COUNT(*) FROM performance_record r
    WHERE r.source_set_id = s.id) AS performanceRecordCount
`;

const STATUSES = ["draft", "active", "archived"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireActor();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM strategic_set s WHERE s.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Strategic set not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load strategic set" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requirePermission("configure_kpis");
    const body = await req.json();

    const [currentRows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM strategic_set s WHERE s.id = ?`,
      [params.id],
    );
    if (currentRows.length === 0) {
      return NextResponse.json({ error: "Strategic set not found" }, { status: 404 });
    }
    const current = currentRows[0];

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if ("name" in body) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2 || name.length > 255) {
        return NextResponse.json(
          { error: "name must be between 2 and 255 characters" },
          { status: 400 },
        );
      }
      setClauses.push("name = ?");
      values.push(name);
    }
    if ("description" in body) {
      const description =
        typeof body.description === "string" ? body.description.trim() : "";
      if (description.length > 1000) {
        return NextResponse.json(
          { error: "description must be at most 1000 characters" },
          { status: 400 },
        );
      }
      setClauses.push("description = ?");
      values.push(description || null);
    }
    if ("status" in body) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      setClauses.push("status = ?");
      values.push(body.status);
    }

    // Start year only moves while nothing depends on it. The WHERE guard below
    // repeats the rule so a record activated between the read and the write
    // cannot slip through.
    let guardStartYear = false;
    if ("startYear" in body) {
      const startYear = Number(body.startYear);
      if (!Number.isInteger(startYear) || startYear < 2400 || startYear > 2700) {
        return NextResponse.json(
          { error: "startYear must be a valid Buddhist-era year" },
          { status: 400 },
        );
      }
      if (startYear !== current.startYear) {
        const reason = startYearLockReason(current as never);
        if (reason) {
          return NextResponse.json({ error: reason }, { status: 409 });
        }
        setClauses.push("start_year = ?");
        values.push(startYear);
        guardStartYear = true;
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const guard = guardStartYear
      ? " AND status = 'draft' AND NOT EXISTS (SELECT 1 FROM performance_record r WHERE r.source_set_id = strategic_set.id)"
      : "";
    let affected: number;
    try {
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE strategic_set SET ${setClauses.join(", ")} WHERE id = ?${guard}`,
        [...values, params.id],
      );
      affected = result.affectedRows;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && err.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { error: `A strategic set starting in ${body.startYear} already exists` },
          { status: 409 },
        );
      }
      throw err;
    }
    if (affected === 0) {
      return NextResponse.json(
        { error: "Start year is locked: the set was activated or changed meanwhile" },
        { status: 409 },
      );
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM strategic_set s WHERE s.id = ?`,
      [params.id],
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update strategic set" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requirePermission("configure_kpis");
    // One atomic statement: only a draft set with no performance record goes.
    // library_kpi / metrics / targets / categories cascade via FK ON DELETE
    // CASCADE; performance_record has no cascade, so it would also refuse.
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM strategic_set
        WHERE id = ? AND status = 'draft'
          AND NOT EXISTS (SELECT 1 FROM performance_record r WHERE r.source_set_id = strategic_set.id)`,
      [params.id],
    );
    if (result.affectedRows === 0) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT ${SELECT_FIELDS} FROM strategic_set s WHERE s.id = ?`,
        [params.id],
      );
      if (rows.length === 0) {
        return NextResponse.json({ error: "Strategic set not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: deleteBlockReason(rows[0] as never) ?? "Strategic set cannot be deleted" },
        { status: 409 },
      );
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete strategic set" },
      { status: 500 },
    );
  }
}
