import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { actorErrorResponse, requirePermission } from "@/lib/auth/session";
import { readEdpexPatch } from "@/lib/kpi/edpexAdmin";

export const dynamic = "force-dynamic";

// Area ids carry "." and Thai ("7.1ข"), so the client encodes them.
const areaIdOf = (raw: string) => decodeURIComponent(raw);

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
      `UPDATE edpex_area SET ${sets.join(", ")} WHERE id = ?`,
      [...values, areaIdOf(params.id)],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "EdPEx area not found" }, { status: 404 });
    }
    return NextResponse.json({ id: areaIdOf(params.id) });
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to update EdPEx area" },
        { status: 500 },
      )
    );
  }
}

/** Refused while any library KPI still uses the area (the FK would otherwise
 *  silently blank those KPIs' area). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("configure_kpis");
    const id = areaIdOf(params.id);
    const [[usage]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM library_kpi WHERE edpex_area_id = ?",
      [id],
    );
    if (Number(usage.n) > 0) {
      return NextResponse.json(
        {
          error: `Can't delete EdPEx area ${id}: ${usage.n} KPI(s) in the library use it. Move them to another area first.`,
        },
        { status: 409 },
      );
    }
    const [result] = await pool.query<ResultSetHeader>("DELETE FROM edpex_area WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "EdPEx area not found" }, { status: 404 });
    }
    return NextResponse.json({ id });
  } catch (err) {
    return (
      actorErrorResponse(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to delete EdPEx area" },
        { status: 500 },
      )
    );
  }
}
