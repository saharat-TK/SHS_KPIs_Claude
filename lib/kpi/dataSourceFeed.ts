// Server-only: turn a data source's raw rows into performance progress values.
// Never import from a "use client" component — it pulls in the MySQL pool.
//
// The feed writes perf_*_quarter_progress directly rather than through the HTTP
// progress routes, exactly as recomputeKpiQuarter does — those routes demand an
// Issue and a Solution, and a computed number has no narrative. Unlike the
// roll-up, the feed RESPECTS the guards: a closed recording period or an
// approval-locked quarter is skipped and reported, never overwritten.
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type {
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceLinkMapping,
} from "@/lib/types";
import type { AggregateParts } from "@/lib/kpi/dataSourceFilters";
import { aggregateParts, matchesFilters } from "@/lib/kpi/dataSourceFilters";
import { isApprovalDataLocked } from "@/lib/kpi/approvalWorkflow";
import { getApprovalState } from "@/lib/kpi/approvalServer";
import { kpiValueFromVariables } from "@/lib/kpi/progress";
import { facultyHeadcount } from "@/lib/kpi/facultyHeadcount";
import { ACADEMIC_RANKS } from "@/lib/types";
import {
  PERFORMANCE_QUARTER_COUNT,
  PERFORMANCE_YEAR_COUNT,
  yearForYearNo,
} from "@/lib/kpi/performancePeriods";
import { recomputeKpiQuarter } from "@/lib/kpi/performance";
import { COLUMN_SELECT, mapColumnRow, parseJsonColumn } from "@/lib/kpi/dataSourcesServer";

type Db = Pool | PoolConnection;

export interface FeedSkip {
  target: string;
  yearNo: number;
  quarterNo: number;
  reason: string;
}

export interface FeedOutcome {
  updated: number;
  skipped: FeedSkip[];
}

const empty = (): FeedOutcome => ({ updated: 0, skipped: [] });

const merge = (a: FeedOutcome, b: FeedOutcome): FeedOutcome => ({
  updated: a.updated + b.updated,
  skipped: [...a.skipped, ...b.skipped],
});

/** Short human summary for a toast. */
export function describeOutcome(outcome: FeedOutcome): string {
  const head = `${outcome.updated} quarter${outcome.updated === 1 ? "" : "s"} updated`;
  if (outcome.skipped.length === 0) return head;

  const byReason = new Map<string, number>();
  for (const s of outcome.skipped) {
    byReason.set(s.reason, (byReason.get(s.reason) ?? 0) + 1);
  }
  const detail = [...byReason.entries()]
    .map(([reason, n]) => `${n} ${reason}`)
    .join(", ");
  return `${head} · ${outcome.skipped.length} skipped (${detail})`;
}

interface Entry {
  id: number;
  year: number;
  quarter: number | null;
  values: Record<string, DataSourceCellValue>;
}

interface LinkRow {
  id: number;
  dataSourceId: number;
  libraryKpiId: number | null;
  libraryMetricId: number | null;
  mappings: DataSourceLinkMapping[];
}

async function loadEntries(db: Db, dataSourceId: number): Promise<Entry[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, year, quarter, values_json FROM data_source_entry WHERE data_source_id = ?",
    [dataSourceId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    year: Number(r.year),
    quarter: r.quarter == null ? null : Number(r.quarter),
    values: parseJsonColumn<Record<string, DataSourceCellValue>>(r.values_json, {}),
  }));
}

async function loadColumns(db: Db, dataSourceId: number): Promise<DataSourceColumn[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT ${COLUMN_SELECT} FROM data_source_column WHERE data_source_id = ? ORDER BY sort_order, id`,
    [dataSourceId],
  );
  return rows.map(mapColumnRow);
}

/** The roster behind a "per faculty member" denominator. Loaded once per feed
 *  run — the headcount is the same for every link, year and quarter, since the
 *  roster carries no history. */
async function loadRoster(db: Db): Promise<{ rank: string; status: string }[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT `rank`, status FROM faculty WHERE status = 'active'",
  );
  return rows.map((r) => ({ rank: String(r.rank), status: String(r.status) }));
}

async function loadLinks(db: Db, where: string, args: unknown[]): Promise<LinkRow[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT l.id, l.data_source_id AS dataSourceId, l.library_kpi_id AS libraryKpiId,
            l.library_metric_id AS libraryMetricId, l.mappings
       FROM data_source_link l ${where}`,
    args,
  );
  return rows
    .map((r) => ({
      id: Number(r.id),
      dataSourceId: Number(r.dataSourceId),
      libraryKpiId: r.libraryKpiId == null ? null : Number(r.libraryKpiId),
      libraryMetricId: r.libraryMetricId == null ? null : Number(r.libraryMetricId),
      mappings: parseJsonColumn<DataSourceLinkMapping[]>(r.mappings, []),
    }))
    // A link with no mappings is evidence only — nothing to compute.
    .filter((l) => l.mappings.length > 0);
}

/** The rows that count toward (yearNo, quarterNo): cumulative within the year.
 *  Annual-grain entries carry no quarter and describe the whole year, so they
 *  count from Q1 onward (decision D5). */
function windowFor(entries: Entry[], startYear: number, yearNo: number, quarterNo: number) {
  const year = yearForYearNo(startYear, yearNo);
  return entries.filter(
    (e) => e.year === year && (e.quarter == null || e.quarter <= quarterNo),
  );
}

/** Where a link's value has to land: one perf row per ACTIVE performance record
 *  that snapshotted the library KPI/metric. */
interface Target {
  perfKpiId: number;
  perfMetricId: number | null;
  recordId: number;
  startYear: number;
  unit: string | null;
  name: string;
}

async function targetsForLink(db: Db, link: LinkRow): Promise<Target[]> {
  if (link.libraryMetricId != null) {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pm.id AS perfMetricId, pm.perf_kpi_id AS perfKpiId, pm.name,
              k.record_id AS recordId, k.unit, r.start_year AS startYear
         FROM perf_metric pm
         JOIN perf_kpi k ON k.id = pm.perf_kpi_id
         JOIN performance_record r ON r.id = k.record_id AND r.status = 'active'
        WHERE pm.source_metric_id = ?`,
      [link.libraryMetricId],
    );
    return rows.map((r) => ({
      perfKpiId: Number(r.perfKpiId),
      perfMetricId: Number(r.perfMetricId),
      recordId: Number(r.recordId),
      startYear: Number(r.startYear),
      unit: r.unit ?? null,
      name: r.name,
    }));
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT k.id AS perfKpiId, k.name, k.record_id AS recordId, k.unit,
            k.has_children AS hasChildren, r.start_year AS startYear
       FROM perf_kpi k
       JOIN performance_record r ON r.id = k.record_id AND r.status = 'active'
      WHERE k.source_kpi_id = ?`,
    [link.libraryKpiId],
  );
  // A KPI with metrics is rolled up from them; feeding it directly would be
  // overwritten on the next roll-up, so leave it alone.
  return rows
    .filter((r) => !r.hasChildren)
    .map((r) => ({
      perfKpiId: Number(r.perfKpiId),
      perfMetricId: null,
      recordId: Number(r.recordId),
      startYear: Number(r.startYear),
      unit: r.unit ?? null,
      name: r.name,
    }));
}

/** Open recording periods for a record, as a "y:q" set. Missing row = closed. */
async function openPeriods(db: Db, recordId: number): Promise<Set<string>> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT year_no, quarter_no FROM performance_record_period
      WHERE record_id = ? AND is_open = 1`,
    [recordId],
  );
  return new Set(rows.map((r) => `${r.year_no}:${r.quarter_no}`));
}

async function applyLink(
  conn: PoolConnection,
  link: LinkRow,
  columns: DataSourceColumn[],
  entries: Entry[],
  roster: { rank: string; status: string }[],
): Promise<FeedOutcome> {
  const outcome = empty();
  const targets = await targetsForLink(conn, link);

  for (const target of targets) {
    const open = await openPeriods(conn, target.recordId);

    for (let yearNo = 1; yearNo <= PERFORMANCE_YEAR_COUNT; yearNo += 1) {
      for (let quarterNo = 1; quarterNo <= PERFORMANCE_QUARTER_COUNT; quarterNo += 1) {
        const rows = windowFor(entries, target.startYear, yearNo, quarterNo);
        // Nothing recorded for this period yet — leave whatever is there alone
        // rather than stamping a null over it.
        if (rows.length === 0) continue;

        if (!open.has(`${yearNo}:${quarterNo}`)) {
          outcome.skipped.push({
            target: target.name,
            yearNo,
            quarterNo,
            reason: "period closed",
          });
          continue;
        }

        const state = await getApprovalState(conn, target.perfKpiId, yearNo, quarterNo);
        if (isApprovalDataLocked(state)) {
          outcome.skipped.push({
            target: target.name,
            yearNo,
            quarterNo,
            reason: state === "approved" ? "approved" : "under review",
          });
          continue;
        }

        const values = new Map<string, AggregateParts>();
        for (const mapping of link.mappings) {
          const matched = rows.filter((e) => matchesFilters(e, columns, mapping.filters));
          // A faculty denominator makes `matched` the numerator outright; only
          // the rows-mode proportion narrows further, and it narrows within
          // `matched` so the numerator stays a subset of the denominator. With a
          // numerator column the two sides can share every row and still differ,
          // so an empty condition list is no longer "nothing to divide".
          const proportion =
            mapping.denominatorSource === "faculty"
              ? { denominator: facultyHeadcount(roster, mapping.facultyRanks ?? ACADEMIC_RANKS) }
              : mapping.numeratorFilters?.length || mapping.numeratorColumnKey
                ? {
                    numerator: mapping.numeratorFilters?.length
                      ? matched.filter((e) =>
                          matchesFilters(e, columns, mapping.numeratorFilters!),
                        )
                      : matched,
                    numeratorColumnKey: mapping.numeratorColumnKey ?? null,
                  }
                : undefined;
          values.set(
            mapping.slot,
            aggregateParts(mapping.aggregation, mapping.columnKey, matched, proportion),
          );
        }

        if (target.perfMetricId != null) {
          // A metric takes the single "value" slot only (it has no variable
          // definitions to map two aggregations onto), but that slot still
          // divided something — so store its numerator/denominator, the same
          // reasoning as the KPI branch below. The parent KPI derives its own
          // pair from the roll-up, not from these.
          const parts = values.get("value") ?? null;
          await conn.query(
            `INSERT INTO perf_metric_quarter_progress
               (perf_metric_id, year_no, quarter_no, progress_value,
                variable1_value, variable2_value, is_computed)
             VALUES (?, ?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value),
               variable1_value = VALUES(variable1_value),
               variable2_value = VALUES(variable2_value), is_computed = 1`,
            [
              target.perfMetricId,
              yearNo,
              quarterNo,
              parts?.value ?? null,
              parts?.numerator ?? null,
              parts?.denominator ?? null,
            ],
          );
          // Let the existing roll-up carry the change up to the parent KPI.
          await recomputeKpiQuarter(conn, target.perfKpiId, yearNo, quarterNo);
        } else {
          // Two mapped slots carry their own dividend and divisor; a single
          // "value" slot still divided something internally (a proportion's
          // population, an average's row count), so store the aggregation's own
          // numerator/denominator rather than leaving the columns empty.
          let progress: number | null;
          let v1: number | null;
          let v2: number | null;
          if (values.has("variable1") || values.has("variable2")) {
            v1 = values.get("variable1")?.value ?? null;
            v2 = values.get("variable2")?.value ?? null;
            // Derive with the same helper the entry form previews with, so the
            // stored number always matches what a human would have seen.
            progress = kpiValueFromVariables(target.unit, v1, v2);
          } else {
            const parts = values.get("value") ?? null;
            progress = parts?.value ?? null;
            v1 = parts?.numerator ?? null;
            v2 = parts?.denominator ?? null;
          }
          await conn.query(
            `INSERT INTO perf_kpi_quarter_progress
               (perf_kpi_id, year_no, quarter_no, progress_value, variable1_value, variable2_value,
                is_computed, value_source)
             VALUES (?, ?, ?, ?, ?, ?, 1, 'data_source')
             ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value),
               variable1_value = VALUES(variable1_value),
               variable2_value = VALUES(variable2_value),
               is_computed = 1, value_source = 'data_source'`,
            [target.perfKpiId, yearNo, quarterNo, progress, v1, v2],
          );
        }
        outcome.updated += 1;
      }
    }
  }
  return outcome;
}

/** Recompute every KPI/metric fed by one data source. */
export async function feedFromDataSource(
  conn: PoolConnection,
  dataSourceId: number,
): Promise<FeedOutcome> {
  const links = await loadLinks(conn, "WHERE l.data_source_id = ?", [dataSourceId]);
  if (links.length === 0) return empty();

  const columns = await loadColumns(conn, dataSourceId);
  const entries = await loadEntries(conn, dataSourceId);
  const roster = await loadRoster(conn);

  let outcome = empty();
  for (const link of links) {
    outcome = merge(outcome, await applyLink(conn, link, columns, entries, roster));
  }
  return outcome;
}

/** Recompute everything feeding one performance record — the manual button. */
export async function feedRecord(
  conn: PoolConnection,
  recordId: number,
): Promise<FeedOutcome> {
  // Every data source linked to a library KPI/metric this record snapshotted.
  const links = await loadLinks(
    conn,
    `LEFT JOIN library_metric lm ON lm.id = l.library_metric_id
     WHERE EXISTS (
       SELECT 1 FROM perf_kpi k
        WHERE k.record_id = ?
          AND (k.source_kpi_id = COALESCE(l.library_kpi_id, lm.kpi_id))
     )`,
    [recordId],
  );
  if (links.length === 0) return empty();

  // Columns and entries are per data source; load each one once.
  const columnsBySource = new Map<number, DataSourceColumn[]>();
  const entriesBySource = new Map<number, Entry[]>();
  const roster = await loadRoster(conn);

  let outcome = empty();
  for (const link of links) {
    if (!columnsBySource.has(link.dataSourceId)) {
      columnsBySource.set(link.dataSourceId, await loadColumns(conn, link.dataSourceId));
      entriesBySource.set(link.dataSourceId, await loadEntries(conn, link.dataSourceId));
    }
    outcome = merge(
      outcome,
      await applyLink(
        conn,
        link,
        columnsBySource.get(link.dataSourceId)!,
        entriesBySource.get(link.dataSourceId)!,
        roster,
      ),
    );
  }
  return outcome;
}
