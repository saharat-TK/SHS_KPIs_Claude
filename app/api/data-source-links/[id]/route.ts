import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  LINK_FROM,
  LINK_SELECT,
  checkSourceManagerAccess,
  errorResponse,
  mapLinkRow,
  validateLinkMappings,
} from "@/lib/kpi/dataSourcesServer";
import { describeOutcome, type FeedOutcome } from "@/lib/kpi/feedOutcome";
import { feedFromDataSource } from "@/lib/kpi/dataSourceFeed";
import { requireActor, type SessionActor } from "@/lib/auth/session";

/** Loads a link's source and checks the actor may manage it: an admin, or the
 *  source's own committee's Committee and Secretary — whatever the link
 *  targets. Returns the response to send (404/403), or the link's source id. */
async function denyLinkWrite(
  linkId: string,
  actor: SessionActor,
): Promise<{ response: NextResponse } | { dataSourceId: number }> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.data_source_id AS dataSourceId, d.committee_id AS committeeId
       FROM data_source_link l JOIN data_source d ON d.id = l.data_source_id
      WHERE l.id = ?`,
    [linkId],
  );
  if (rows.length === 0) {
    return { response: NextResponse.json({ error: "Link not found" }, { status: 404 }) };
  }
  const permit = await checkSourceManagerAccess(
    pool,
    { committeeId: rows[0].committeeId as string },
    actor.facultyId,
    actor.role,
  );
  if ("error" in permit) {
    return { response: NextResponse.json({ error: permit.error }, { status: 403 }) };
  }
  return { dataSourceId: Number(rows[0].dataSourceId) };
}

export const dynamic = "force-dynamic";

/** Edit a link's mappings or note. The target KPI/metric is immutable — changing
 *  it is a different link, and the unique key is built on it. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const access = await denyLinkWrite(params.id, await requireActor());
    if ("response" in access) return access.response;
    const { dataSourceId } = access;
    const b = await req.json();

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if ("mappings" in b) {
      const mappings = await validateLinkMappings(
        pool,
        dataSourceId,
        b.mappings,
      );
      setClauses.push("mappings = ?");
      values.push(mappings.length > 0 ? JSON.stringify(mappings) : null);
    }
    if ("note" in b) {
      setClauses.push("note = ?");
      values.push(b.note?.trim() || null);
    }
    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(params.id);

    // Re-feed in the same transaction. Without this the target keeps the value
    // computed under the OLD filter, so the number on screen would contradict
    // the filter shown beside it.
    const conn = await pool.getConnection();
    let outcome: FeedOutcome;
    try {
      await conn.beginTransaction();
      await conn.query<ResultSetHeader>(
        `UPDATE data_source_link SET ${setClauses.join(", ")} WHERE id = ?`,
        values,
      );
      outcome = await feedFromDataSource(conn, dataSourceId);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${LINK_SELECT} ${LINK_FROM} WHERE l.id = ?`,
      [params.id],
    );
    return NextResponse.json({ ...mapLinkRow(rows[0]), feed: describeOutcome(outcome) });
  } catch (err) {
    return errorResponse(err, "Failed to update link");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const access = await denyLinkWrite(params.id, await requireActor());
    if ("response" in access) return access.response;
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM data_source_link WHERE id = ?",
      [params.id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return errorResponse(err, "Failed to remove link");
  }
}
