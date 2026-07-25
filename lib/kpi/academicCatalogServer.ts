// Server-only academic catalog access. Never import this from a "use client"
// component — it depends on the MySQL pool type.
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type { AcademicCatalog } from "@/lib/types";

type Db = Pool | PoolConnection;

/** Load the complete small reference catalog in display order. Programs and
 *  curricula deliberately retain stable codes so existing JSON cell values do
 *  not need a data migration. */
export async function loadAcademicCatalog(db: Db): Promise<AcademicCatalog> {
  const [programResult, curriculumResult] = await Promise.all([
    db.query<RowDataPacket[]>(
      `SELECT code, label_th AS label, sort_order AS sortOrder
         FROM academic_program
        ORDER BY sort_order, code`,
    ),
    db.query<RowDataPacket[]>(
      `SELECT code, program_code AS programCode, label_th AS label, sort_order AS sortOrder
         FROM curriculum
        ORDER BY sort_order, code`,
    ),
  ]);

  return {
    programs: programResult[0].map((row) => ({
      code: String(row.code),
      label: String(row.label),
      sortOrder: Number(row.sortOrder),
    })),
    curricula: curriculumResult[0].map((row) => ({
      code: String(row.code),
      programCode: String(row.programCode),
      label: String(row.label),
      sortOrder: Number(row.sortOrder),
    })),
  };
}
