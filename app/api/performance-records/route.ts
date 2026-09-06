import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { copySetIntoRecord } from "@/lib/kpi/performance";

export const dynamic = "force-dynamic";

const SELECT_FIELDS = `
  r.id, r.source_set_id AS sourceSetId, r.name,
  r.start_year AS startYear, r.end_year AS endYear, r.status,
  r.activated_by AS activatedBy, r.activated_at AS activatedAt,
  r.last_synced_at AS lastSyncedAt,
  (SELECT COUNT(*) FROM perf_kpi k WHERE k.record_id = r.id) AS kpiCount,
  (SELECT COUNT(*) FROM performance_record_period p
     WHERE p.record_id = r.id AND p.is_open = 1) AS openPeriodCount
`;

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM performance_record r ORDER BY r.start_year DESC, r.id DESC`,
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance records" },
      { status: 500 },
    );
  }
}

// Activate a library set: snapshot its whole KPI tree into a new record.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.sourceSetId) {
      return NextResponse.json({ error: "sourceSetId is required" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [sets] = await conn.query<RowDataPacket[]>(
        "SELECT name, start_year, status FROM strategic_set WHERE id = ?",
        [b.sourceSetId],
      );
      if (sets.length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "Strategic set not found" }, { status: 404 });
      }
      if (sets[0].status !== "active") {
        await conn.rollback();
        return NextResponse.json(
          { error: "Strategic set must be active before performance activation" },
          { status: 409 },
        );
      }
      const name = (b.name?.trim() as string) || `${sets[0].name} — Performance`;

      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO performance_record (source_set_id, name, start_year, status, activated_by, last_synced_at)
         VALUES (?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)`,
        [b.sourceSetId, name, sets[0].start_year, b.activatedBy ?? null],
      );
      const recordId = ins.insertId;

      await copySetIntoRecord(conn, Number(b.sourceSetId), recordId);
      await conn.commit();

      const [created] = await conn.query<RowDataPacket[]>(
        `SELECT ${SELECT_FIELDS} FROM performance_record r WHERE r.id = ?`,
        [recordId],
      );
      return NextResponse.json(created[0], { status: 201 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to activate performance record" },
      { status: 500 },
    );
  }
}
