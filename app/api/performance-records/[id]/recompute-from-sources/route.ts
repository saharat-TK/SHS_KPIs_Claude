import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import { describeOutcome } from "@/lib/kpi/feedOutcome";
import { feedRecord } from "@/lib/kpi/dataSourceFeed";

export const dynamic = "force-dynamic";

/** Recompute every KPI/metric in this record that a data source feeds. Mirrors
 *  the "Sync from Library" endpoint next door: one transaction, no auth (the
 *  app has no session layer), and the outcome comes back so the UI can say what
 *  was skipped. */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const outcome = await feedRecord(conn, Number(params.id));
      await conn.commit();
      return NextResponse.json({ ...outcome, summary: describeOutcome(outcome) });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to recompute from data sources",
      },
      { status: 500 },
    );
  }
}
