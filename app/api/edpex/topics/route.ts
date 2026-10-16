import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { actorErrorResponse, requirePermission } from "@/lib/auth/session";
import { readEdpexTopicInput } from "@/lib/kpi/edpexAdmin";

export const dynamic = "force-dynamic";

/** Add an EdPEx topic. Its code becomes its id and cannot change afterwards. */
export async function POST(req: NextRequest) {
  try {
    await requirePermission("configure_kpis");
    const input = readEdpexTopicInput(await req.json());
    if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM edpex_topic WHERE id = ?",
      [input.id],
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `EdPEx topic ${input.id} already exists` },
        { status: 409 },
      );
    }
    await pool.query(
      `INSERT INTO edpex_topic (id, name, sort_order)
       SELECT ?, ?, COALESCE(MAX(sort_order), 0) + 1 FROM edpex_topic`,
      [input.id, input.name],
    );
    return NextResponse.json({ id: input.id, name: input.name }, { status: 201 });
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to add EdPEx topic" },
        { status: 500 },
      )
    );
  }
}
