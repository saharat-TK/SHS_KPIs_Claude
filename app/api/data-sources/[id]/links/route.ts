import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  LINK_FROM,
  LINK_SELECT,
  checkSourceManagerAccess,
  errorResponse,
  linkTargetCommittee,
  loadSourceShape,
  mapLinkRow,
  validateLinkMappings,
} from "@/lib/kpi/dataSourcesServer";
import { describeOutcome, type FeedOutcome } from "@/lib/kpi/feedOutcome";
import { feedFromDataSource } from "@/lib/kpi/dataSourceFeed";
import { requireActor } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireActor();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LINK_SELECT} ${LINK_FROM}
        WHERE l.data_source_id = ?
        ORDER BY s.start_year DESC, k.sort_order, m.sort_order, l.id`,
      [params.id],
    );
    return NextResponse.json(rows.map(mapLinkRow));
  } catch (err) {
    return errorResponse(err, "Failed to load links");
  }
}

/** Link a data source to exactly one library KPI or metric. `mappings` says which
 *  rows produce the target's value (decision D3); an empty list keeps the link as
 *  evidence only. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Admins, and the source's own committee's Committee and Secretary.
    const actor = await requireActor();
    const b = await req.json();
    const libraryKpiId = b.libraryKpiId ? Number(b.libraryKpiId) : null;
    const libraryMetricId = b.libraryMetricId ? Number(b.libraryMetricId) : null;

    const source = await loadSourceShape(pool, params.id);
    if (!source) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }
    const permit = await checkSourceManagerAccess(pool, source, actor.facultyId, actor.role);
    if ("error" in permit) {
      return NextResponse.json({ error: permit.error }, { status: 403 });
    }

    if ((libraryKpiId === null) === (libraryMetricId === null)) {
      return NextResponse.json(
        { error: "Link exactly one KPI or one metric" },
        { status: 400 },
      );
    }

    // A secretary feeds only their own committees' KPIs: the feed writes the
    // target's progress, so another committee's numbers aren't theirs to set.
    // An unassigned target counts as not theirs.
    if (permit.access === "secretary") {
      const targetCommittee = await linkTargetCommittee(pool, { libraryKpiId, libraryMetricId });
      if (targetCommittee === undefined) {
        return NextResponse.json({ error: "KPI or metric not found" }, { status: 404 });
      }
      if (!targetCommittee || !actor.committeeIds.includes(targetCommittee)) {
        return NextResponse.json(
          { error: "You can link only KPIs and metrics of your own committees" },
          { status: 403 },
        );
      }
    }

    // Authoritative regardless of what the UI offered.
    const mappings = await validateLinkMappings(pool, params.id, b.mappings);

    // Write and feed in one transaction: a new link must not leave the KPIs it
    // now governs reading whatever they said before it existed.
    const conn = await pool.getConnection();
    let insertId: number;
    let outcome: FeedOutcome;
    try {
      await conn.beginTransaction();
      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO data_source_link
           (data_source_id, library_kpi_id, library_metric_id, mappings, note)
         VALUES (?, ?, ?, ?, ?)`,
        [
          params.id,
          libraryKpiId,
          libraryMetricId,
          mappings.length > 0 ? JSON.stringify(mappings) : null,
          b.note?.trim() || null,
        ],
      );
      insertId = ins.insertId;
      outcome = await feedFromDataSource(conn, Number(params.id));
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LINK_SELECT} ${LINK_FROM} WHERE l.id = ?`,
      [insertId],
    );
    return NextResponse.json(
      { ...mapLinkRow(rows[0]), feed: describeOutcome(outcome) },
      { status: 201 },
    );
  } catch (err) {
    // uq_ds_link (data_source_id, target_key) — the same target twice.
    if (err instanceof Error && "code" in err && err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "This data source is already linked to that KPI or metric" },
        { status: 409 },
      );
    }
    return errorResponse(err, "Failed to link data source");
  }
}
