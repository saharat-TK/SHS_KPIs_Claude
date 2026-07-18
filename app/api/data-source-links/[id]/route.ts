import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/mysql";
import type { ResultSetHeader } from "mysql2";
import { errorResponse } from "@/lib/kpi/dataSourcesServer";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM data_source_link WHERE id = ?",
      [params.id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    return errorResponse(err, "Failed to remove link");
  }
}
