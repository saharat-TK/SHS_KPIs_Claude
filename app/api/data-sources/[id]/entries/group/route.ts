// Save one multi-input entry as a whole — the write half of the grouped edit
// window.
//
// A multiple-input entry is stored as one row per value (one per author), with
// 1/n shares that must sum to 1, so editing it means updating some rows, adding
// some and dropping others *together*. The per-row routes can't do that safely:
// each runs feedFromDataSource() inside its own transaction (N re-feeds, like
// the bulk import avoids), and a failure partway would leave the entry
// half-saved with shares that no longer add up. Here every row is validated up
// front, the changes run in one transaction, and the feed runs once.
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  checkEntryWriteAccess,
  errorResponse,
  loadSourceShape,
  loadRefChecker,
  resolveColumnOptions,
} from "@/lib/kpi/dataSourcesServer";
import {
  DataSourceValidationError,
  normalizeEntryPeriod,
  validateEntryValues,
} from "@/lib/kpi/dataSources";
import { feedFromDataSource } from "@/lib/kpi/dataSourceFeed";
import { planGroupSave } from "@/lib/kpi/entryGroups";
import { requireActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** One entry has a row per value, so this is generous; it only stops a runaway request. */
const MAX_ROWS = 200;

type GroupRow = {
  id?: unknown;
  year: unknown;
  quarter: unknown;
  values?: Record<string, unknown>;
  note?: string | null;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requireActor();
    const b = await req.json();
    const originalIds: number[] = Array.isArray(b.originalIds)
      ? b.originalIds.map(Number)
      : [];
    const rows: GroupRow[] = Array.isArray(b.rows) ? b.rows : [];

    if (originalIds.length === 0 || originalIds.some((id) => !Number.isInteger(id))) {
      return NextResponse.json({ error: "No entry to save" }, { status: 400 });
    }
    if (rows.length > MAX_ROWS || originalIds.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `An entry is limited to ${MAX_ROWS} rows` },
        { status: 400 },
      );
    }

    const source = await loadSourceShape(pool, params.id);
    if (!source) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }

    const denied = await checkEntryWriteAccess(
      pool,
      source,
      actor.facultyId,
      actor.role,
    );
    if (denied) return NextResponse.json({ error: denied }, { status: 403 });

    // Every row being replaced must be one of this source's own.
    const [owned] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM data_source_entry WHERE data_source_id = ? AND id IN (?)",
      [params.id, originalIds],
    );
    if (owned.length !== new Set(originalIds).size) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    let plan;
    try {
      plan = planGroupSave(
        originalIds,
        rows.map((row) => ({ id: row.id === undefined || row.id === null ? undefined : Number(row.id) })),
      );
    } catch (err) {
      throw new DataSourceValidationError(err instanceof Error ? err.message : String(err));
    }

    const columns = await resolveColumnOptions(pool, source.columns);
    const checkRefs = await loadRefChecker(pool, source.columns);

    const prepared = rows.map((row, i) => {
      try {
        const period = normalizeEntryPeriod(source.periodGrain, row.year, row.quarter);
        const cells = validateEntryValues(columns, row.values ?? {});
        checkRefs(cells);
        return {
          id: row.id === undefined || row.id === null ? undefined : Number(row.id),
          year: period.year,
          quarter: period.quarter,
          valuesJson: JSON.stringify(cells),
          note: row.note?.trim() || null,
        };
      } catch (err) {
        if (err instanceof DataSourceValidationError) {
          throw new DataSourceValidationError(`Row ${i + 1}: ${err.message}`);
        }
        throw err;
      }
    });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const row of prepared) {
        if (row.id === undefined) continue;
        await conn.query<ResultSetHeader>(
          `UPDATE data_source_entry
              SET year = ?, quarter = ?, values_json = ?, note = ?
            WHERE id = ? AND data_source_id = ?`,
          [row.year, row.quarter, row.valuesJson, row.note, row.id, params.id],
        );
      }

      const fresh = prepared.filter((row) => row.id === undefined);
      if (fresh.length > 0) {
        await conn.query<ResultSetHeader>(
          `INSERT INTO data_source_entry
             (data_source_id, year, quarter, values_json, note, recorded_by)
           VALUES ?`,
          [
            fresh.map((row) => [
              params.id,
              row.year,
              row.quarter,
              row.valuesJson,
              row.note,
              actor.facultyId,
            ]),
          ],
        );
      }

      if (plan.remove.length > 0) {
        await conn.query<ResultSetHeader>(
          "DELETE FROM data_source_entry WHERE data_source_id = ? AND id IN (?)",
          [params.id, plan.remove],
        );
      }

      await feedFromDataSource(conn, Number(params.id));
      await conn.commit();
      return NextResponse.json({
        updated: plan.update.length,
        inserted: plan.insert,
        removed: plan.remove.length,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return errorResponse(err, "Failed to save entry");
  }
}
