import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { LIBRARY_KPI_FIELDS, toLibraryKpiRow } from "@/lib/kpi/fields";
import {
  LIBRARY_KPI_INSERT_COLUMNS,
  libraryKpiInsertValues,
} from "@/lib/kpi/libraryKpiInsert";
import { isCalculationType } from "@/lib/types";
import { normaliseEdpex } from "@/lib/kpi/edpex";
import { validateAnnualTargets, type TargetInput } from "@/lib/kpi/targets";
import { loadEdpexCatalog } from "@/lib/kpi/edpexServer";
import { requirePermission, actorErrorResponse, requireActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireActor();
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
    const kpis = rows.map(toLibraryKpiRow);

    // ?include=targets attaches each KPI's annual targets (CSV export). One
    // query for the whole set rather than one per KPI.
    if (req.nextUrl.searchParams.get("include") === "targets" && kpis.length > 0) {
      const [targets] = await pool.query<RowDataPacket[]>(
        `SELECT t.kpi_id AS kpiId, t.year_no AS yearNo, t.target_value AS targetValue
           FROM library_kpi_annual_target t
           JOIN library_kpi k ON k.id = t.kpi_id
          WHERE k.set_id = ?
          ORDER BY t.kpi_id, t.year_no`,
        [setId],
      );
      const byKpi = new Map<number, { yearNo: number; targetValue: number | null }[]>();
      for (const t of targets) {
        const list = byKpi.get(Number(t.kpiId)) ?? [];
        list.push({
          yearNo: Number(t.yearNo),
          targetValue: t.targetValue == null ? null : Number(t.targetValue),
        });
        byKpi.set(Number(t.kpiId), list);
      }
      return NextResponse.json(
        kpis.map((k) => ({ ...k, annualTargets: byKpi.get(Number(k.id)) ?? [] })),
      );
    }
    return NextResponse.json(kpis);
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load KPIs" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("configure_kpis");
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

    const edpex = normaliseEdpex(b, await loadEdpexCatalog(pool));
    if (!edpex.ok) {
      return NextResponse.json({ error: edpex.error }, { status: 400 });
    }

    // Optional targets: the same checks as the KPI editor's targets PUT.
    const fiveYearTarget = b.fiveYearTarget == null ? null : Number(b.fiveYearTarget);
    if (fiveYearTarget != null && (Number.isNaN(fiveYearTarget) || fiveYearTarget < 0)) {
      return NextResponse.json(
        { error: "5-Year Target must be a non-negative number" },
        { status: 400 },
      );
    }
    // One row per year (the last one given wins); blank years are not stored.
    const annualTargets: TargetInput[] = [
      ...new Map<number, TargetInput>(
        (Array.isArray(b.annualTargets) ? b.annualTargets : [])
          .filter((t: TargetInput) => t?.targetValue != null)
          .map((t: TargetInput) => [t.yearNo, t]),
      ).values(),
    ];
    const targetCheck = validateAnnualTargets(fiveYearTarget, annualTargets);
    if (!targetCheck.ok) {
      return NextResponse.json({ error: targetCheck.error }, { status: 400 });
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
        `INSERT INTO library_kpi (${LIBRARY_KPI_INSERT_COLUMNS})
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        libraryKpiInsertValues(
          Number(b.setId),
          { ...b, ...edpex.value, fiveYearTarget },
          sortOrder,
        ),
      );
      if (annualTargets.length > 0) {
        await conn.query(
          "INSERT INTO library_kpi_annual_target (kpi_id, year_no, target_value) VALUES ?",
          [annualTargets.map((t) => [ins.insertId, t.yearNo, t.targetValue])],
        );
      }
      // No sync to active performance records: a new KPI is a draft, and drafts
      // join them on their first save in the KPI editor.
      await conn.commit();

      const [created] = await conn.query<RowDataPacket[]>(
        `SELECT ${LIBRARY_KPI_FIELDS} FROM library_kpi k WHERE k.id = ?`,
        [ins.insertId],
      );
      return NextResponse.json(toLibraryKpiRow(created[0]), { status: 201 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create KPI" },
      { status: 500 },
    );
  }
}
