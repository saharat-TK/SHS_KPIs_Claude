import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { bumpVersion } from "@/lib/formula";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, expression, current_version AS currentVersion FROM formula WHERE id = ?",
      [params.id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Formula not found" }, { status: 404 });
    }
    const [vars] = await pool.query<RowDataPacket[]>(
      "SELECT id, formula_id AS formulaId, symbol, label, source FROM formula_variable WHERE formula_id = ? ORDER BY id",
      [params.id],
    );
    const [versions] = await pool.query<RowDataPacket[]>(
      `SELECT id, formula_id AS formulaId, version, expression, author,
              change_note AS changeNote, created_at AS createdAt
       FROM formula_version WHERE formula_id = ? ORDER BY created_at DESC`,
      [params.id],
    );
    return NextResponse.json({ ...rows[0], variables: vars, versions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load formula" },
      { status: 500 },
    );
  }
}

// Save a new expression: bumps the version, updates the formula, and appends an
// audited formula_version row — mirroring the original in-memory save().
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const b = await req.json();
    if (!b.expression || !b.expression.trim()) {
      return NextResponse.json({ error: "expression is required" }, { status: 400 });
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
      const nextVersion = bumpVersion(cur[0].currentVersion);
      await conn.query(
        "UPDATE formula SET expression = ?, current_version = ? WHERE id = ?",
        [b.expression.trim(), nextVersion, params.id],
      );
      await conn.query(
        "INSERT INTO formula_version (formula_id, version, expression, author, change_note) VALUES (?, ?, ?, ?, ?)",
        [params.id, nextVersion, b.expression.trim(), b.author ?? null, b.changeNote?.trim() || null],
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
      { error: err instanceof Error ? err.message : "Failed to save formula" },
      { status: 500 },
    );
  }
}
