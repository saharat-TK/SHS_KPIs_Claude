import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { validateAnnualTargets } from "@/lib/kpi/targets";
import { syncActiveRecordsForSet, setIdForKpi } from "@/lib/kpi/performance";
import { syncInheritedMetricTargetsForKpi } from "@/lib/kpi/targetInheritance";

export const dynamic = "force-dynamic";

// Replace the 5 annual-target rows for a KPI in one transaction, enforcing the
// per-year cap against the KPI's five_year_target.
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

    const [kpiRows] = await pool.query<RowDataPacket[]>(
      "SELECT five_year_target AS fiveYearTarget FROM library_kpi WHERE id = ?",
      [params.id],
    );
    if (kpiRows.length === 0) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }

    const check = validateAnnualTargets(
      kpiRows[0].fiveYearTarget == null ? null : Number(kpiRows[0].fiveYearTarget),
      targets,
    );
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM library_kpi_annual_target WHERE kpi_id = ?", [params.id]);
      for (const t of targets) {
        await conn.query(
          "INSERT INTO library_kpi_annual_target (kpi_id, year_no, target_value) VALUES (?, ?, ?)",
          [params.id, t.yearNo, t.targetValue ?? null],
        );
      }
      await syncInheritedMetricTargetsForKpi(conn, Number(params.id));
      // Reflect the updated targets on every active performance record.
      await syncActiveRecordsForSet(conn, await setIdForKpi(conn, Number(params.id)));
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT year_no AS yearNo, target_value AS targetValue FROM library_kpi_annual_target WHERE kpi_id = ? ORDER BY year_no",
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
