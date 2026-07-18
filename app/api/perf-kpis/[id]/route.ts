import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { PERF_KPI_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

// Single perf KPI with its annual targets, entered quarter progress, and the
// parent record's start year (for quarter/year labelling).
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PERF_KPI_FIELDS}, r.start_year AS startYear
       FROM perf_kpi k JOIN performance_record r ON r.id = k.record_id
       WHERE k.id = ?`,
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Performance KPI not found" }, { status: 404 });
    }
    const [targets] = await pool.query<RowDataPacket[]>(
      "SELECT year_no AS yearNo, target_value AS targetValue FROM perf_kpi_annual_target WHERE perf_kpi_id = ? ORDER BY year_no",
      [params.id],
    );
    const [progress] = await pool.query<RowDataPacket[]>(
      `SELECT year_no AS yearNo, quarter_no AS quarterNo, progress_value AS progressValue,
              variable1_value AS variable1Value, variable2_value AS variable2Value,
              is_computed AS isComputed, issue, solution
       FROM perf_kpi_quarter_progress WHERE perf_kpi_id = ? ORDER BY year_no, quarter_no`,
      [params.id],
    );
    // Provenance is derived, not stored: a KPI is "fed" when a data source is
    // linked to the library KPI it was snapshotted from, with a mapping on it.
    const [fed] = await pool.query<RowDataPacket[]>(
      `SELECT d.id AS dataSourceId, d.name AS dataSourceName
         FROM data_source_link l
         JOIN data_source d ON d.id = l.data_source_id
        WHERE l.library_kpi_id = ? AND l.mappings IS NOT NULL
        LIMIT 1`,
      [rows[0].sourceKpiId],
    );

    return NextResponse.json({
      ...rows[0],
      annualTargets: targets,
      progress,
      fedBy: fed[0]
        ? { dataSourceId: Number(fed[0].dataSourceId), dataSourceName: fed[0].dataSourceName }
        : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance KPI" },
      { status: 500 },
    );
  }
}
