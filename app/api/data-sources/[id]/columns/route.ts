import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";
import type { ColumnAutoFill, DataSourceColumnType } from "@/lib/types";
import {
  COLUMN_SELECT,
  checkSourceManagerAccess,
  errorResponse,
  foreignLinksBrokenByColumns,
  loadSourceShape,
  mapColumnRow,
} from "@/lib/kpi/dataSourcesServer";
import { requireActor, actorErrorResponse } from "@/lib/auth/session";
import { validateColumnConfig } from "@/lib/kpi/columnLinks";
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
    await requireActor();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${COLUMN_SELECT} FROM data_source_column
        WHERE data_source_id = ? ORDER BY sort_order, id`,
      [params.id],
    );
    return NextResponse.json(rows.map(mapColumnRow));
  } catch (err) {
    const authError = actorErrorResponse(err);
    if (authError) return authError;
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
  /** "Ref by" target, as an index into this same array — a new column's final
   *  col_key isn't known until it's assigned below, so the client can't name it. */
  refIndex?: number | null;
  isMultiple?: boolean;
  autoFill?: ColumnAutoFill | null;
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
    // Admins, and the source's own committee's Committee and Secretary (see
    // sourceManagerAccess). The page shows Manage Columns by the same rule.
    const actor = await requireActor();
    const body = await req.json();
    const input: ColumnInput[] = Array.isArray(body?.columns) ? body.columns : [];

    const source = await loadSourceShape(pool, params.id);
    if (!source) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }
    const permit = await checkSourceManagerAccess(pool, source, actor.facultyId, actor.role);
    if ("error" in permit) {
      return NextResponse.json({ error: permit.error }, { status: 403 });
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
        isMultiple: c.isMultiple ? 1 : 0,
        autoFill: c.autoFill === "share" ? ("share" as const) : null,
        refIndex: typeof c.refIndex === "number" ? c.refIndex : null,
      };
    });

    // Resolve each "ref by" index to the target's final key, then check the
    // link settings as a whole (one multiple column, valid pairs, …).
    const linked = prepared.map((c) => {
      if (c.refIndex === null) return { ...c, refColKey: null };
      const target = prepared[c.refIndex];
      if (!target) {
        throw new DataSourceValidationError(`"${c.label}" is ref by a column that no longer exists`);
      }
      return { ...c, refColKey: target.colKey };
    });
    const problems = validateColumnConfig(
      linked.map((c) => ({
        colKey: c.colKey,
        label: c.label,
        dataType: c.dataType,
        isRequired: !!c.isRequired,
        refColKey: c.refColKey,
        isMultiple: !!c.isMultiple,
        autoFill: c.autoFill,
      })),
    );
    if (problems.length > 0) throw new DataSourceValidationError(problems[0]);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const keptIds = linked.map((c) => c.id).filter((id): id is number => id != null);
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

      for (const [i, c] of linked.entries()) {
        const optionsJson = c.options ? JSON.stringify(c.options) : null;
        if (c.id != null) {
          await conn.query(
            `UPDATE data_source_column
                SET label = ?, data_type = ?, unit = ?, options = ?, ref_col_key = ?,
                    is_multiple = ?, auto_fill = ?, is_required = ?, sort_order = ?
              WHERE id = ? AND data_source_id = ?`,
            [
              c.label,
              c.dataType,
              c.unit,
              optionsJson,
              c.refColKey,
              c.isMultiple,
              c.autoFill,
              c.isRequired,
              i,
              c.id,
              params.id,
            ],
          );
        } else {
          await conn.query(
            `INSERT INTO data_source_column
               (data_source_id, col_key, label, data_type, unit, options, ref_col_key,
                is_multiple, auto_fill, is_required, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              params.id,
              c.colKey,
              c.label,
              c.dataType,
              c.unit,
              optionsJson,
              c.refColKey,
              c.isMultiple,
              c.autoFill,
              c.isRequired,
              i,
            ],
          );
        }
      }

      // A secretary may reshape their source freely, but not in a way that
      // stops another committee's KPI from being fed. Checked against the
      // columns as written above, so every kind of breakage counts.
      if (permit.access === "secretary") {
        const broken = await foreignLinksBrokenByColumns(conn, params.id, actor.committeeIds);
        if (broken.length > 0) {
          await conn.rollback();
          const names = broken.map((b) => `"${b.name}"`).join(", ");
          return NextResponse.json(
            {
              error: `This change would break the data feed to ${names}, which belongs to another committee. Ask an admin to make this change.`,
            },
            { status: 409 },
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
