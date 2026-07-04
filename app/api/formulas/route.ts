import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const dynamic = "force-dynamic";

// List all formulas, each with its variables grouped in. (JS grouping instead
// of JSON_ARRAYAGG for MariaDB 10.4 compatibility.)
export async function GET() {
  try {
    const [formulas] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, expression, current_version AS currentVersion FROM formula ORDER BY name",
    );
    const [vars] = await pool.query<RowDataPacket[]>(
      "SELECT id, formula_id AS formulaId, symbol, label, source FROM formula_variable ORDER BY id",
    );
    const byFormula = new Map<number, RowDataPacket[]>();
    for (const v of vars) {
      const list = byFormula.get(v.formulaId) ?? [];
      list.push(v);
      byFormula.set(v.formulaId, list);
    }
    const result = formulas.map((f) => ({ ...f, variables: byFormula.get(f.id) ?? [] }));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load formulas" },
      { status: 500 },
    );
  }
}

// Create a new formula + its variables + the initial v1.0 version.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.name || !b.name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!b.expression || !b.expression.trim()) {
      return NextResponse.json({ error: "expression is required" }, { status: 400 });
    }
    const variables: { symbol: string; label: string; source?: string }[] =
      Array.isArray(b.variables) ? b.variables : [];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [ins] = await conn.query<ResultSetHeader>(
        "INSERT INTO formula (name, expression, current_version) VALUES (?, ?, 'v1.0')",
        [b.name.trim(), b.expression.trim()],
      );
      const id = ins.insertId;
      for (const v of variables) {
        if (!v.symbol) continue;
        await conn.query(
          "INSERT INTO formula_variable (formula_id, symbol, label, source) VALUES (?, ?, ?, ?)",
          [id, v.symbol, v.label ?? v.symbol, v.source ?? null],
        );
      }
      await conn.query(
        "INSERT INTO formula_version (formula_id, version, expression, author, change_note) VALUES (?, 'v1.0', ?, ?, ?)",
        [id, b.expression.trim(), b.author ?? null, b.changeNote?.trim() || "Initial version."],
      );
      await conn.commit();

      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT id, name, expression, current_version AS currentVersion FROM formula WHERE id = ?",
        [id],
      );
      const [vrows] = await conn.query<RowDataPacket[]>(
        "SELECT id, formula_id AS formulaId, symbol, label, source FROM formula_variable WHERE formula_id = ?",
        [id],
      );
      return NextResponse.json({ ...rows[0], variables: vrows }, { status: 201 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create formula" },
      { status: 500 },
    );
  }
}
