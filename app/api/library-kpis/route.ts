import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { LIBRARY_KPI_FIELDS } from "@/lib/kpi/fields";
import { syncActiveRecordsForSet } from "@/lib/kpi/performance";
import { isCalculationType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const setId = req.nextUrl.searchParams.get("setId");
    if (!setId) {
      return NextResponse.json({ error: "setId is required" }, { status: 400 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LIBRARY_KPI_FIELDS},
              (SELECT COUNT(*) FROM library_metric m WHERE m.kpi_id = k.id) AS metricCount
       FROM library_kpi k WHERE k.set_id = ? ORDER BY k.sort_order, k.id`,
      [setId],
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load KPIs" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.setId) {
      return NextResponse.json({ error: "setId is required" }, { status: 400 });
    }
    if (!b.name || !b.name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (b.calculationType && !isCalculationType(b.calculationType)) {
      return NextResponse.json(
        { error: `Unknown calculationType: ${b.calculationType}` },
        { status: 400 },
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [maxRow] = await conn.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM library_kpi WHERE set_id = ?",
        [b.setId],
      );
      const sortOrder = b.sortOrder ?? maxRow[0]?.next ?? 1;

      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO library_kpi
           (set_id, name, description, category_id, kpi_type, data_collect_method,
            collection_period, data_source_url, committee_id, person_in_charge_id,
            weight, unit, five_year_target, calculation_type, calculation_logic,
            formula_id, threshold_green, threshold_amber, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          b.setId,
          b.name.trim(),
          b.description?.trim() || null,
          b.categoryId || null,
          b.kpiType || "operational",
          b.dataCollectMethod?.trim() || null,
          b.collectionPeriod || "every_quarter",
          b.dataSourceUrl?.trim() || null,
          b.committeeId || null,
          b.personInChargeId || null,
          b.weight ?? 0,
          b.unit?.trim() || null,
          b.fiveYearTarget ?? null,
          b.calculationType || "weighted_sum",
          b.calculationLogic?.trim() || null,
          b.formulaId ?? null,
          b.thresholdGreen ?? null,
          b.thresholdAmber ?? null,
          sortOrder,
        ],
      );
      // Propagate the new KPI to every active performance record for this set.
      await syncActiveRecordsForSet(conn, Number(b.setId));
      await conn.commit();

      const [created] = await conn.query<RowDataPacket[]>(
        `SELECT ${LIBRARY_KPI_FIELDS} FROM library_kpi k WHERE k.id = ?`,
        [ins.insertId],
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
      { error: err instanceof Error ? err.message : "Failed to create KPI" },
      { status: 500 },
    );
  }
}
