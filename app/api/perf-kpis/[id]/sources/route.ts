import { NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { LINK_SELECT, LINK_FROM, mapLinkRow } from "@/lib/kpi/dataSourcesServer";
import type { PerfKpiSource } from "@/lib/types";

export const dynamic = "force-dynamic";

// The data sources behind one performance KPI: those linked to the library KPI
// it was snapshotted from, plus those linked to any of its metrics.
//
// Links are LIBRARY-level (data_source_link.library_kpi_id / library_metric_id)
// while this route is asked about a perf_kpi, so the bridge is
// perf_kpi.source_kpi_id / perf_metric.source_metric_id.
//
// Unlike PerfKpi.fedBy this returns EVERY linked source (fedBy is LIMIT 1) and
// keeps evidence-only links (fedBy drops them with `mappings IS NOT NULL`) —
// their raw data is still worth showing, they just don't feed a value.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const [kpiRows] = await pool.query<RowDataPacket[]>(
      "SELECT source_kpi_id AS sourceKpiId FROM perf_kpi WHERE id = ?",
      [params.id],
    );
    if (kpiRows.length === 0) {
      return NextResponse.json({ error: "Performance KPI not found" }, { status: 404 });
    }
    // A KPI added straight to a record (not snapshotted) has no library twin, so
    // only its metrics can carry links.
    const sourceKpiId = kpiRows[0].sourceKpiId ?? null;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LINK_SELECT},
              d.period_grain AS periodGrain, d.committee_id AS committeeId,
              d.status AS dataSourceStatus, c.name AS committeeName
       ${LINK_FROM}
       LEFT JOIN committees c ON c.id = d.committee_id
        WHERE l.library_kpi_id = ?
           OR l.library_metric_id IN (
                SELECT source_metric_id FROM perf_metric
                 WHERE perf_kpi_id = ? AND source_metric_id IS NOT NULL)
        ORDER BY d.name, l.id`,
      [sourceKpiId, params.id],
    );

    // One entry per data source, carrying every link that reaches this KPI.
    const bySource = new Map<number, PerfKpiSource>();
    for (const row of rows) {
      const id = Number(row.dataSourceId);
      let source = bySource.get(id);
      if (!source) {
        source = {
          id,
          name: row.dataSourceName,
          periodGrain: row.periodGrain,
          committeeId: row.committeeId,
          committeeName: row.committeeName ?? null,
          status: row.dataSourceStatus,
          links: [],
        };
        bySource.set(id, source);
      }
      source.links.push(mapLinkRow(row));
    }

    return NextResponse.json([...bySource.values()]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load linked data sources" },
      { status: 500 },
    );
  }
}
