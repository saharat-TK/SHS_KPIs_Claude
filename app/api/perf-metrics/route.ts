import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { METRIC_QUARTER_PROGRESS_FIELDS, PERF_METRIC_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

// List a KPI's sub-KPIs, each with its annual targets + entered quarter progress
// grouped in (so the KPI page can show per-year target / current / % / status).
export async function GET(req: NextRequest) {
  try {
    const perfKpiId = req.nextUrl.searchParams.get("perfKpiId");
    if (!perfKpiId) {
      return NextResponse.json({ error: "perfKpiId is required" }, { status: 400 });
    }
    const [metrics] = await pool.query<RowDataPacket[]>(
      `SELECT ${PERF_METRIC_FIELDS} FROM perf_metric m WHERE m.perf_kpi_id = ? ORDER BY m.sort_order, m.id`,
      [perfKpiId],
    );
    if (metrics.length === 0) return NextResponse.json([]);

    const ids = metrics.map((m) => m.id);
    const [targets] = await pool.query<RowDataPacket[]>(
      `SELECT perf_metric_id AS perfMetricId, year_no AS yearNo, target_value AS targetValue
       FROM perf_metric_annual_target WHERE perf_metric_id IN (?) ORDER BY year_no`,
      [ids],
    );
    const [progress] = await pool.query<RowDataPacket[]>(
      `SELECT perf_metric_id AS perfMetricId, ${METRIC_QUARTER_PROGRESS_FIELDS}
       FROM perf_metric_quarter_progress WHERE perf_metric_id IN (?)
       ORDER BY year_no, quarter_no`,
      [ids],
    );

    const targetsByMetric = new Map<number, RowDataPacket[]>();
    for (const t of targets) {
      const list = targetsByMetric.get(t.perfMetricId) ?? [];
      list.push({ yearNo: t.yearNo, targetValue: t.targetValue } as RowDataPacket);
      targetsByMetric.set(t.perfMetricId, list);
    }
    const progressByMetric = new Map<number, RowDataPacket[]>();
    for (const { perfMetricId, ...row } of progress) {
      const list = progressByMetric.get(perfMetricId) ?? [];
      // Spread the row rather than re-listing its columns: the field list above
      // is then the only place a new progress column has to be named. Re-listing
      // is how the KPI record-list endpoint once silently dropped the variables.
      list.push(row as RowDataPacket);
      progressByMetric.set(perfMetricId, list);
    }

    const result = metrics.map((m) => ({
      ...m,
      annualTargets: targetsByMetric.get(m.id) ?? [],
      progress: progressByMetric.get(m.id) ?? [],
    }));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance metrics" },
      { status: 500 },
    );
  }
}
