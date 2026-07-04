import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { validateAnnualTargets } from "@/lib/kpi/targets";
import { syncActiveRecordsForSet, setIdForMetric } from "@/lib/kpi/performance";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const targets = body?.targets;
    if (!Array.isArray(targets)) {
      return NextResponse.json(
        { error: "targets must be an array of { yearNo, targetValue }" },
        { status: 400 },
      );
    }

    const [metricRows] = await pool.query<RowDataPacket[]>(
      "SELECT five_year_target AS fiveYearTarget FROM library_metric WHERE id = ?",
      [params.id],
    );
    if (metricRows.length === 0) {
      return NextResponse.json({ error: "Metric not found" }, { status: 404 });
    }

    const check = validateAnnualTargets(
      metricRows[0].fiveYearTarget == null ? null : Number(metricRows[0].fiveYearTarget),
      targets,
    );
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM library_metric_annual_target WHERE metric_id = ?", [params.id]);
      for (const t of targets) {
        await conn.query(
          "INSERT INTO library_metric_annual_target (metric_id, year_no, target_value) VALUES (?, ?, ?)",
          [params.id, t.yearNo, t.targetValue ?? null],
        );
      }
      // Reflect the updated targets on every active performance record.
      await syncActiveRecordsForSet(conn, await setIdForMetric(conn, Number(params.id)));
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT year_no AS yearNo, target_value AS targetValue FROM library_metric_annual_target WHERE metric_id = ? ORDER BY year_no",
      [params.id],
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save targets" },
      { status: 500 },
    );
  }
}
