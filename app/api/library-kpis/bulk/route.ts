// Bulk KPI creation — the write half of the set page's Batch Add grid.
//
// This exists rather than looping the single-create POST so the batch lands
// whole or not at all: every row is validated up front and inserted in one
// statement inside one transaction. The rows are drafts (see
// lib/kpi/libraryKpiInsert.ts), so nothing is synced to performance records
// here — each KPI joins them on its first save in the KPI editor.
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  LIBRARY_KPI_INSERT_COLUMNS,
  libraryKpiInsertValues,
} from "@/lib/kpi/libraryKpiInsert";
import {
  KPI_BATCH_MAX_ROWS,
  kpiBatchRowError,
  normalizeKpiBatchRow,
  toKpiCreateInput,
  type KpiBatchLookups,
} from "@/lib/kpi/kpiBatch";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const setId = Number(b.setId);
    if (!Number.isInteger(setId) || setId <= 0) {
      return NextResponse.json({ error: "setId is required" }, { status: 400 });
    }
    const raw: unknown[] = Array.isArray(b.rows) ? b.rows : [];
    if (raw.length === 0) {
      return NextResponse.json({ error: "No KPIs to create" }, { status: 400 });
    }
    if (raw.length > KPI_BATCH_MAX_ROWS) {
      return NextResponse.json(
        { error: `A batch is limited to ${KPI_BATCH_MAX_ROWS} KPIs at a time` },
        { status: 400 },
      );
    }

    const [sets] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM strategic_set WHERE id = ?",
      [setId],
    );
    if (sets.length === 0) {
      return NextResponse.json({ error: "Strategic set not found" }, { status: 404 });
    }

    // The same lookups the grid validated against, read fresh: a category or
    // committee deleted since the page loaded must not slip in.
    const [[kpiTypes], [categories], [committees]] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT id, kpi_type_name AS label FROM kpi_type"),
      pool.query<RowDataPacket[]>(
        "SELECT id, kpi_type AS kpiType, name AS label FROM kpi_categories WHERE set_id = ?",
        [setId],
      ),
      pool.query<RowDataPacket[]>("SELECT id, name FROM committees"),
    ]);
    const lookups = { kpiTypes, categories, committees } as unknown as KpiBatchLookups;

    const rows = raw.map(normalizeKpiBatchRow);
    const errors = rows
      .map((row, i) => {
        const error = kpiBatchRowError(row, lookups);
        return error ? `Row ${i + 1}: ${error}` : null;
      })
      .filter((e): e is string => e !== null);
    if (errors.length > 0) {
      // The client previews with the same rules, so reaching here means the
      // lookups changed underneath it. Name the rows so they stay findable.
      const more = errors.length > 3 ? ` (and ${errors.length - 3} more)` : "";
      return NextResponse.json(
        { error: errors.slice(0, 3).join("; ") + more, rowErrors: errors },
        { status: 400 },
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [maxRow] = await conn.query<RowDataPacket[]>(
        "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM library_kpi WHERE set_id = ?",
        [setId],
      );
      const firstSort = Number(maxRow[0]?.next ?? 1);
      const values = rows.map((row, i) =>
        libraryKpiInsertValues(setId, toKpiCreateInput(row), firstSort + i),
      );

      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO library_kpi (${LIBRARY_KPI_INSERT_COLUMNS}) VALUES ?`,
        [values],
      );
      await conn.commit();
      return NextResponse.json(
        { inserted: ins.affectedRows ?? values.length },
        { status: 201 },
      );
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create KPIs" },
      { status: 500 },
    );
  }
}
