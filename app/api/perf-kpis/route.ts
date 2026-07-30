import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { KPI_QUARTER_PROGRESS_FIELDS, PERF_KPI_FIELDS } from "@/lib/kpi/fields";

export const dynamic = "force-dynamic";

// List a record's KPIs, each with its annual targets + quarter progress grouped
// in (so the record page can show per-year target / current / % / status without
// opening each KPI). Batched, mirroring app/api/perf-metrics/route.ts.
export async function GET(req: NextRequest) {
  try {
    const recordId = req.nextUrl.searchParams.get("recordId");
    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${PERF_KPI_FIELDS},
              (SELECT COUNT(*) FROM perf_metric m WHERE m.perf_kpi_id = k.id) AS metricCount
       FROM perf_kpi k WHERE k.record_id = ? ORDER BY k.sort_order, k.id`,
      [recordId],
    );
    if (rows.length === 0) return NextResponse.json([]);

    const ids = rows.map((k) => k.id);
    const [targets] = await pool.query<RowDataPacket[]>(
      `SELECT perf_kpi_id AS perfKpiId, year_no AS yearNo, target_value AS targetValue
       FROM perf_kpi_annual_target WHERE perf_kpi_id IN (?) ORDER BY year_no`,
      [ids],
    );
    const [progress] = await pool.query<RowDataPacket[]>(
      `SELECT perf_kpi_id AS perfKpiId, ${KPI_QUARTER_PROGRESS_FIELDS}
       FROM perf_kpi_quarter_progress WHERE perf_kpi_id IN (?)
       ORDER BY year_no, quarter_no`,
      [ids],
    );

    const targetsByKpi = new Map<number, RowDataPacket[]>();
    for (const t of targets) {
      const list = targetsByKpi.get(t.perfKpiId) ?? [];
      list.push({ yearNo: t.yearNo, targetValue: t.targetValue } as RowDataPacket);
      targetsByKpi.set(t.perfKpiId, list);
    }
    const progressByKpi = new Map<number, RowDataPacket[]>();
    for (const p of progress) {
      const list = progressByKpi.get(p.perfKpiId) ?? [];
      list.push({
        yearNo: p.yearNo,
        quarterNo: p.quarterNo,
        progressValue: p.progressValue,
        variable1Value: p.variable1Value,
        variable2Value: p.variable2Value,
        isComputed: p.isComputed,
        valueSource: p.valueSource,
        issue: p.issue,
        solution: p.solution,
      } as RowDataPacket);
      progressByKpi.set(p.perfKpiId, list);
    }

    const result = rows.map((k) => ({
      ...k,
      annualTargets: targetsByKpi.get(k.id) ?? [],
      progress: progressByKpi.get(k.id) ?? [],
    }));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load performance KPIs" },
      { status: 500 },
    );
  }
}
