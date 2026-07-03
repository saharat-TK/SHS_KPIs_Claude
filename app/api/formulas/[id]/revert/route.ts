import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import { bumpVersion } from "@/lib/formula";

export const dynamic = "force-dynamic";

// Revert to a prior version: restores that version's expression as a NEW bumped
// version (never rewrites history) — mirrors the original in-memory revert().
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const b = await req.json();
    const versionId = b?.versionId;
    if (!versionId) {
      return NextResponse.json({ error: "versionId is required" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [cur] = await conn.query<RowDataPacket[]>(
        "SELECT current_version AS currentVersion FROM formula WHERE id = ? FOR UPDATE",
        [params.id],
      );
      if (cur.length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "Formula not found" }, { status: 404 });
      }
      const [target] = await conn.query<RowDataPacket[]>(
        "SELECT version, expression FROM formula_version WHERE id = ? AND formula_id = ?",
        [versionId, params.id],
      );
      if (target.length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
      const nextVersion = bumpVersion(cur[0].currentVersion);
      const expression = target[0].expression;
      await conn.query(
        "UPDATE formula SET expression = ?, current_version = ? WHERE id = ?",
        [expression, nextVersion, params.id],
      );
      await conn.query(
        "INSERT INTO formula_version (formula_id, version, expression, author, change_note) VALUES (?, ?, ?, ?, ?)",
        [params.id, nextVersion, expression, b.author ?? null, `Reverted to ${target[0].version}.`],
      );
      await conn.commit();

      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT id, name, expression, current_version AS currentVersion FROM formula WHERE id = ?",
        [params.id],
      );
      return NextResponse.json(rows[0]);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to revert formula" },
      { status: 500 },
    );
  }
}
