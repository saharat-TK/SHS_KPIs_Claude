import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { actorErrorResponse, requirePermission } from "@/lib/auth/session";
import { readEdpexAreaInput } from "@/lib/kpi/edpexAdmin";

export const dynamic = "force-dynamic";

/** Add an area to a topic. Its id is the topic id + code ("7.1" + "ข") and,
 *  like the code, cannot change afterwards. */
export async function POST(req: NextRequest) {
  try {
    await requirePermission("configure_kpis");
    const input = readEdpexAreaInput(await req.json());
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

    const [topics] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM edpex_topic WHERE id = ?",
      [input.topicId],
    );
    if (topics.length === 0) {
      return NextResponse.json(
        { error: `EdPEx topic ${input.topicId} not found` },
        { status: 404 },
      );
    }
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM edpex_area WHERE id = ? OR (topic_id = ? AND code = ?)",
      [input.id, input.topicId, input.code],
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `EdPEx area ${input.id} already exists` },
        { status: 409 },
      );
    }
    await pool.query(
      `INSERT INTO edpex_area (id, topic_id, code, name, sort_order)
       SELECT ?, ?, ?, ?, COALESCE(MAX(sort_order), 0) + 1 FROM edpex_area`,
      [input.id, input.topicId, input.code, input.name],
    );
    return NextResponse.json(
      { id: input.id, topicId: input.topicId, code: input.code, name: input.name },
      { status: 201 },
    );
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to add EdPEx area" },
        { status: 500 },
      )
    );
  }
}
