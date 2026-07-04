import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { syncRecordFromLibrary, recomputeRecordRollups } from "@/lib/kpi/performance";

export const dynamic = "force-dynamic";

const SELECT_FIELDS = `
  r.id, r.source_set_id AS sourceSetId, r.name,
  r.start_year AS startYear, r.end_year AS endYear, r.status,
  r.activated_by AS activatedBy, r.activated_at AS activatedAt,
  r.last_synced_at AS lastSyncedAt,
  (SELECT COUNT(*) FROM perf_kpi k WHERE k.record_id = r.id) AS kpiCount
`;

// Re-pull definitions + targets from the source library set, preserving any
// entered quarterly progress.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await syncRecordFromLibrary(conn, Number(params.id));
      await recomputeRecordRollups(conn, Number(params.id));
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM performance_record r WHERE r.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Performance record not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync performance record" },
      { status: 500 },
    );
  }
}
