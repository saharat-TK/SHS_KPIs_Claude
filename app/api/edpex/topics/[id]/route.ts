import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { actorErrorResponse, requirePermission } from "@/lib/auth/session";
import { readEdpexPatch } from "@/lib/kpi/edpexAdmin";

export const dynamic = "force-dynamic";

// Topic ids carry "." and may carry Thai, so the client encodes them.
const topicIdOf = (raw: string) => decodeURIComponent(raw);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("configure_kpis");
    const patch = readEdpexPatch(await req.json());
    if (!patch.ok) return NextResponse.json({ error: patch.error }, { status: 400 });

    const sets: string[] = [];
    const values: unknown[] = [];
    if (patch.name !== undefined) {
      sets.push("name = ?");
      values.push(patch.name);
    }
    if (patch.sortOrder !== undefined) {
      sets.push("sort_order = ?");
      values.push(patch.sortOrder);
    }
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE edpex_topic SET ${sets.join(", ")} WHERE id = ?`,
      [...values, topicIdOf(params.id)],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "EdPEx topic not found" }, { status: 404 });
    }
    return NextResponse.json({ id: topicIdOf(params.id) });
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to update EdPEx topic" },
        { status: 500 },
      )
    );
  }
}

/** Delete a topic and its areas — refused while any KPI in the library still
 *  points at the topic or one of its areas, so no KPI loses its placement
 *  without someone deciding where it goes instead. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("configure_kpis");
    const id = topicIdOf(params.id);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[usage]] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS n FROM library_kpi
          WHERE edpex_topic_id = ?
             OR edpex_area_id IN (SELECT id FROM edpex_area WHERE topic_id = ?)`,
        [id, id],
      );
      if (Number(usage.n) > 0) {
        await conn.rollback();
        return NextResponse.json(
          {
            error: `Can't delete EdPEx topic ${id}: ${usage.n} KPI(s) in the library use it. Move them to another topic first.`,
          },
          { status: 409 },
        );
      }
      await conn.query("DELETE FROM edpex_area WHERE topic_id = ?", [id]);
      const [result] = await conn.query<ResultSetHeader>(
        "DELETE FROM edpex_topic WHERE id = ?",
        [id],
      );
      if (result.affectedRows === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "EdPEx topic not found" }, { status: 404 });
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return NextResponse.json({ id });
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to delete EdPEx topic" },
        { status: 500 },
      )
    );
  }
}
