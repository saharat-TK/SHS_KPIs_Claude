import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import { committeeIdFromName } from "@/lib/kpi/committee";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { PoolConnection } from "mysql2/promise";

export const dynamic = "force-dynamic";

const SELECT_FIELDS =
  "id, name, faculty, status, head_id AS headId, key_metric AS keyMetric";

const STATUSES = ["active", "inactive", "draft"] as const;

const DEFAULT_FACULTY = "School of Health Science";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

/** The first free id derived from the name, falling back to a random suffix
 *  when the name yields no ASCII slug (e.g. a Thai-only committee name). */
async function nextCommitteeId(conn: PoolConnection, name: string) {
  const base = committeeIdFromName(name);
  if (!base) return `cmt-${Math.random().toString(36).slice(2, 9)}`;

  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT id FROM committees WHERE id = ? OR id LIKE ?",
    [base, `${base}-%`],
  );
  const taken = new Set(rows.map((r) => r.id as string));
  if (!taken.has(base)) return base;

  for (let n = 2; n < 100; n++) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, 30 - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `cmt-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${SELECT_FIELDS} FROM committees ORDER BY name`,
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load committees" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = cleanString(body.name);
    const faculty = cleanString(body.faculty) || DEFAULT_FACULTY;
    const status = cleanString(body.status) || "active";
    const headId = cleanNullableString(body.headId);
    // key_metric is NOT NULL; an em dash is what the UI has always shown for "unset".
    const keyMetric = cleanString(body.keyMetric) || "—";

    if (!name) {
      return NextResponse.json({ error: "Committee name is required" }, { status: 400 });
    }
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid committee status" }, { status: 400 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const id = await nextCommitteeId(conn, name);

      await conn.query<ResultSetHeader>(
        `INSERT INTO committees (id, name, faculty, status, head_id, key_metric)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, faculty, status, headId, keyMetric],
      );
      await conn.commit();

      const [created] = await conn.query<RowDataPacket[]>(
        `SELECT ${SELECT_FIELDS} FROM committees WHERE id = ?`,
        [id],
      );
      return NextResponse.json(created[0], { status: 201 });
    } catch (err: unknown) {
      await conn.rollback();
      if (err && typeof err === "object" && "code" in err) {
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return NextResponse.json(
            { error: "Selected lead faculty member no longer exists" },
            { status: 400 },
          );
        }
        if (err.code === "ER_DUP_ENTRY") {
          return NextResponse.json(
            { error: "A committee with this id already exists" },
            { status: 409 },
          );
        }
      }
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create committee" },
      { status: 500 },
    );
  }
}
