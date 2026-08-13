// Bulk entry import — the write half of the CSV upload flow.
//
// This exists rather than looping the single-entry POST because that route runs
// feedFromDataSource() inside its transaction, which fans out to every KPI the
// source feeds (see docs/data-source-feed-flow.md). N rows through it would mean
// N full re-feeds, and a failure partway would leave the file half imported.
// Here every row is validated up front, inserted in one statement, and the feed
// runs exactly once.
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { ResultSetHeader } from "mysql2";
import {
  checkEntryWriteAccess,
  errorResponse,
  loadSourceShape,
  resolveColumnOptions,
} from "@/lib/kpi/dataSourcesServer";
import {
  DataSourceValidationError,
  normalizeEntryPeriod,
  validateEntryValues,
} from "@/lib/kpi/dataSources";
import { feedFromDataSource } from "@/lib/kpi/dataSourceFeed";
import { requireActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** A ceiling on one import, so a runaway file cannot build a statement large
 *  enough to trip max_allowed_packet or hold the feed's locks for minutes. */
const MAX_ROWS = 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const actor = await requireActor();
    const b = await req.json();
    const rows = Array.isArray(b.rows) ? b.rows : [];

    const source = await loadSourceShape(pool, params.id);
    if (!source) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }
    if (source.columns.length === 0) {
      return NextResponse.json(
        { error: "Define this data source's columns before recording data" },
        { status: 409 },
      );
    }

    const denied = await checkEntryWriteAccess(
      pool,
      source,
      actor.facultyId,
      actor.role,
    );
    if (denied) return NextResponse.json({ error: denied }, { status: 403 });

    if (rows.length === 0) {
      return NextResponse.json({ error: "No rows to import" }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `An import is limited to ${MAX_ROWS} rows at a time` },
        { status: 400 },
      );
    }

    // Resolve the derived options once — the roster and catalog do not change
    // mid-import, and per-row lookups would be the bulk of the request's cost.
    const columns = await resolveColumnOptions(pool, source.columns);

    const values: unknown[][] = rows.map(
      (row: { year: unknown; quarter: unknown; values?: Record<string, unknown>; note?: string | null }, i: number) => {
        try {
          const period = normalizeEntryPeriod(source.periodGrain, row.year, row.quarter);
          const cells = validateEntryValues(columns, row.values ?? {});
          return [
            params.id,
            period.year,
            period.quarter,
            JSON.stringify(cells),
            row.note?.trim() || null,
            actor.facultyId,
          ];
        } catch (err) {
          // The client previews with the same rules, so reaching here means the
          // file changed or the roster did. Name the row so it stays findable.
          if (err instanceof DataSourceValidationError) {
            throw new DataSourceValidationError(`Row ${i + 1}: ${err.message}`);
          }
          throw err;
        }
      },
    );

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO data_source_entry
           (data_source_id, year, quarter, values_json, note, recorded_by)
         VALUES ?`,
        [values],
      );
      await feedFromDataSource(conn, Number(params.id));
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
    return errorResponse(err, "Failed to import entries");
  }
}
