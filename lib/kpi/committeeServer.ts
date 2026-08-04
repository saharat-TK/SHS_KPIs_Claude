// Server-only helpers for committees. Never import from a "use client"
// component — it pulls in the MySQL pool.
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type { CommitteeUsage } from "@/lib/kpi/committee";

type Db = Pool | PoolConnection;

/**
 * What is still attached to a committee. `committee_memberships` cascades on
 * delete, `library_kpi`/`library_metric` null out their committee_id, and
 * `perf_kpi.committee_id` has no FK at all — it would simply be left pointing at
 * a committee that no longer exists, which is how the approval workflow loses an
 * approver's position (see resolveActorPosition in approvalServer.ts). These
 * counts are the only thing standing between a delete and silent data loss.
 * (`data_source` is RESTRICT, so the DB would refuse that one anyway.)
 */
export async function loadCommitteeUsage(db: Db, id: string): Promise<CommitteeUsage> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM committee_memberships WHERE committee_id = ?) AS memberships,
       (SELECT COUNT(*) FROM data_source           WHERE committee_id = ?) AS dataSources,
       (SELECT COUNT(*) FROM library_kpi           WHERE committee_id = ?) AS libraryKpis,
       (SELECT COUNT(*) FROM library_metric        WHERE committee_id = ?) AS libraryMetrics,
       (SELECT COUNT(*) FROM perf_kpi              WHERE committee_id = ?) AS performanceKpis`,
    [id, id, id, id, id],
  );
  const r = rows[0] ?? {};
  return {
    memberships: Number(r.memberships ?? 0),
    dataSources: Number(r.dataSources ?? 0),
    libraryKpis: Number(r.libraryKpis ?? 0),
    libraryMetrics: Number(r.libraryMetrics ?? 0),
    performanceKpis: Number(r.performanceKpis ?? 0),
  };
}
