import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import type { DataSourceColumnType } from "@/lib/types";
import { COLUMN_SELECT, errorResponse, mapColumnRow } from "@/lib/kpi/dataSourcesServer";
import {
  DATA_SOURCE_COLUMN_TYPES,
  DataSourceValidationError,
  slugifyColumnKey,
  uniqueColumnKey,
} from "@/lib/kpi/dataSources";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${COLUMN_SELECT} FROM data_source_column
        WHERE data_source_id = ? ORDER BY sort_order, id`,
      [params.id],
    );
    return NextResponse.json(rows.map(mapColumnRow));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load columns" },
      { status: 500 },
    );
  }
}

interface ColumnInput {
  id?: number;
  colKey?: string;
  label?: string;
  dataType?: DataSourceColumnType;
  unit?: string | null;
  options?: string[] | null;
  isRequired?: boolean;
}

/** Replace the whole column set in one transaction. Existing columns are matched
 *  by id so their col_key — and therefore every recorded value keyed by it —
 *  survives a rename. Deleting a column leaves orphaned keys in older entries'
 *  values_json; those are simply not rendered. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const input: ColumnInput[] = Array.isArray(body?.columns) ? body.columns : [];

    const [sources] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM data_source WHERE id = ?",
      [params.id],
    );
    if (sources.length === 0) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }

    // Validate + assign keys before touching the database.
    const keys: string[] = [];
    const prepared = input.map((c) => {
      const label = c.label?.trim();
      if (!label) throw new DataSourceValidationError("Every column needs a label");

      const dataType = c.dataType ?? "text";
      if (!DATA_SOURCE_COLUMN_TYPES.includes(dataType)) {
        throw new DataSourceValidationError(`Unknown column type "${dataType}"`);
      }

      const colKey = uniqueColumnKey(c.colKey?.trim() || slugifyColumnKey(label), keys);
      keys.push(colKey);

      const options =
        dataType === "select"
          ? (c.options ?? []).map((o) => String(o).trim()).filter(Boolean)
          : null;
      if (dataType === "select" && options!.length === 0) {
        throw new DataSourceValidationError(`"${label}" is a choice column, so it needs at least one option`);
      }

      return {
        id: c.id ?? null,
        colKey,
        label,
        dataType,
        unit: c.unit?.trim() || null,
        options,
        isRequired: c.isRequired ? 1 : 0,
      };
    });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const keptIds = prepared.map((c) => c.id).filter((id): id is number => id != null);
      if (keptIds.length > 0) {
        await conn.query(
          `DELETE FROM data_source_column
            WHERE data_source_id = ? AND id NOT IN (${keptIds.map(() => "?").join(",")})`,
          [params.id, ...keptIds],
        );
      } else {
        await conn.query("DELETE FROM data_source_column WHERE data_source_id = ?", [
          params.id,
        ]);
      }

      for (const [i, c] of prepared.entries()) {
        const optionsJson = c.options ? JSON.stringify(c.options) : null;
        if (c.id != null) {
          await conn.query(
            `UPDATE data_source_column
                SET label = ?, data_type = ?, unit = ?, options = ?, is_required = ?, sort_order = ?
              WHERE id = ? AND data_source_id = ?`,
            [c.label, c.dataType, c.unit, optionsJson, c.isRequired, i, c.id, params.id],
          );
        } else {
          await conn.query(
            `INSERT INTO data_source_column
               (data_source_id, col_key, label, data_type, unit, options, is_required, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              params.id,
              c.colKey,
              c.label,
              c.dataType,
              c.unit,
              optionsJson,
              c.isRequired,
              i,
            ],
          );
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${COLUMN_SELECT} FROM data_source_column
        WHERE data_source_id = ? ORDER BY sort_order, id`,
      [params.id],
    );
    return NextResponse.json(rows.map(mapColumnRow));
  } catch (err) {
    return errorResponse(err, "Failed to save columns");
  }
}
