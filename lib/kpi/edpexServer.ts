// Server-only EdPEx catalog access. Never import this from a "use client"
// component — it depends on the MySQL pool type.
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type { EdpexTopic } from "@/lib/types";
import { buildEdpexCatalog } from "@/lib/kpi/edpex";

type Db = Pool | PoolConnection;

/** The whole topic → area list, in display order. Small enough to load per
 *  request wherever a KPI's EdPEx pair is validated. */
export async function loadEdpexCatalog(db: Db): Promise<EdpexTopic[]> {
  const [[topics], [areas]] = await Promise.all([
    db.query<RowDataPacket[]>(
      "SELECT id, name, sort_order AS sortOrder FROM edpex_topic",
    ),
    db.query<RowDataPacket[]>(
      `SELECT id, topic_id AS topicId, code, name, sort_order AS sortOrder
         FROM edpex_area`,
    ),
  ]);
  return buildEdpexCatalog(
    topics.map((t) => ({
      id: String(t.id),
      name: String(t.name),
      sortOrder: Number(t.sortOrder),
    })),
    areas.map((a) => ({
      id: String(a.id),
      topicId: String(a.topicId),
      code: String(a.code),
      name: String(a.name),
      sortOrder: Number(a.sortOrder),
    })),
  );
}
