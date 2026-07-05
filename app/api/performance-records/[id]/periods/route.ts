import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import {
  buildPerformancePeriodMatrix,
  normalizePerformancePeriodInput,
} from "@/lib/kpi/performancePeriods";

export const dynamic = "force-dynamic";

const SELECT_FIELDS = `
  year_no AS yearNo, quarter_no AS quarterNo, is_open AS isOpen,
  opened_by AS openedBy, opened_at AS openedAt,
  updated_by AS updatedBy, updated_at AS updatedAt
`;

function keyOf(yearNo: number, quarterNo: number) {
  return `${yearNo}:${quarterNo}`;
}

async function recordExists(id: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM performance_record WHERE id = ?",
    [id],
  );
  return rows.length > 0;
}

async function loadPeriods(id: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SELECT_FIELDS}
     FROM performance_record_period
     WHERE record_id = ?
     ORDER BY year_no, quarter_no`,
    [id],
  );
  const metadata = new Map<string, RowDataPacket>();
  rows.forEach((row) => metadata.set(keyOf(row.yearNo, row.quarterNo), row));

  const rawPeriods = rows.map((row) => ({
    yearNo: row.yearNo,
    quarterNo: row.quarterNo,
    isOpen: row.isOpen,
  }));

  return buildPerformancePeriodMatrix(rawPeriods).map((period) => {
    const row = metadata.get(keyOf(period.yearNo, period.quarterNo));
    return {
      ...period,
      openedBy: (row?.openedBy as string | null | undefined) ?? null,
      openedAt: (row?.openedAt as string | null | undefined) ?? null,
      updatedBy: (row?.updatedBy as string | null | undefined) ?? null,
      updatedAt: (row?.updatedAt as string | null | undefined) ?? null,
    };
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    if (!(await recordExists(params.id))) {
      return NextResponse.json({ error: "Performance record not found" }, { status: 404 });
    }
    return NextResponse.json(await loadPeriods(params.id));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load recording periods" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const periods = normalizePerformancePeriodInput(body.periods ?? []);
    const seen = new Set(periods.map((p) => keyOf(p.yearNo, p.quarterNo)));

    if (periods.length !== 20 || seen.size !== 20) {
      return NextResponse.json(
        { error: "Exactly 20 unique recording periods are required" },
        { status: 400 },
      );
    }

    if (!(await recordExists(params.id))) {
      return NextResponse.json({ error: "Performance record not found" }, { status: 404 });
    }

    const updatedBy = typeof body.updatedBy === "string" ? body.updatedBy : null;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const period of periods) {
        await conn.query(
          `INSERT INTO performance_record_period
             (record_id, year_no, quarter_no, is_open, opened_by, opened_at, updated_by, updated_at)
           VALUES (?, ?, ?, ?, ?, IF(? = 1, CURRENT_TIMESTAMP, NULL), ?, CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE
             is_open = VALUES(is_open),
             opened_by = IF(VALUES(is_open) = 1, VALUES(opened_by), opened_by),
             opened_at = IF(VALUES(is_open) = 1, CURRENT_TIMESTAMP, opened_at),
             updated_by = VALUES(updated_by),
             updated_at = CURRENT_TIMESTAMP`,
          [
            params.id,
            period.yearNo,
            period.quarterNo,
            period.isOpen ? 1 : 0,
            period.isOpen ? updatedBy : null,
            period.isOpen ? 1 : 0,
            updatedBy,
          ],
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return NextResponse.json(await loadPeriods(params.id));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save recording periods" },
      { status: 500 },
    );
  }
}
