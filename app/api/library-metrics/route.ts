import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { LIBRARY_METRIC_FIELDS } from "@/lib/kpi/fields";
import { syncActiveRecordsForSet, setIdForKpi } from "@/lib/kpi/performance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const kpiId = req.nextUrl.searchParams.get("kpiId");
    if (!kpiId) {
      return NextResponse.json({ error: "kpiId is required" }, { status: 400 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LIBRARY_METRIC_FIELDS} FROM library_metric m WHERE m.kpi_id = ? ORDER BY m.sort_order, m.id`,
      [kpiId],
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load metrics" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.kpiId) {
      return NextResponse.json({ error: "kpiId is required" }, { status: 400 });
    }
    if (!b.name || !b.name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [maxRow] = await conn.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM library_metric WHERE kpi_id = ?",
        [b.kpiId],
      );
      const sortOrder = b.sortOrder ?? maxRow[0]?.next ?? 1;

      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO library_metric
           (kpi_id, name, description, category_id, data_collect_method,
            collection_period, data_source_url, committee_id, person_in_charge_id,
            weight, unit, five_year_target, threshold_green, threshold_amber, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          b.kpiId,
          b.name.trim(),
          b.description?.trim() || null,
          b.categoryId || null,
          b.dataCollectMethod?.trim() || null,
          b.collectionPeriod || "every_quarter",
          b.dataSourceUrl?.trim() || null,
          b.committeeId || null,
          b.personInChargeId || null,
          b.weight ?? 0,
          b.unit?.trim() || null,
          b.fiveYearTarget ?? null,
          b.thresholdGreen ?? null,
          b.thresholdAmber ?? null,
          sortOrder,
        ],
      );
      // Propagate the new sub-KPI to every active performance record.
      await syncActiveRecordsForSet(conn, await setIdForKpi(conn, Number(b.kpiId)));
      await conn.commit();

      const [created] = await conn.query<RowDataPacket[]>(
        `SELECT ${LIBRARY_METRIC_FIELDS} FROM library_metric m WHERE m.id = ?`,
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
      { error: err instanceof Error ? err.message : "Failed to create metric" },
      { status: 500 },
    );
  }
}
