import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, name AS label, description, sort_order AS sortOrder";

// Bulk reorder: body is the full list of category ids in the desired order.
// Renormalizes sort_order to a clean 1..N based on array position — this also
// heals any gaps/dupes left over from ad-hoc inserts.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const order: unknown = body?.order;

    if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
      return NextResponse.json(
        { error: "order must be an array of category ids" },
        { status: 400 },
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (let i = 0; i < order.length; i++) {
        await conn.query("UPDATE kpi_categories SET sort_order = ? WHERE id = ?", [
          i + 1,
          order[i],
        ]);
      }

      await conn.commit();

      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT ${SELECT_FIELDS} FROM kpi_categories ORDER BY sort_order, id`,
      );
      return NextResponse.json(rows);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reorder categories" },
      { status: 500 },
    );
  }
}
