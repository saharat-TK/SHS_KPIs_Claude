// Server-only: turn a data source's raw rows into performance progress values.
// Never import from a "use client" component — it pulls in the MySQL pool.
//
// The feed writes perf_*_quarter_progress directly rather than through the HTTP
// progress routes, exactly as recomputeKpiQuarter does — those routes demand an
// Issue and a Solution, and a computed number has no narrative. Unlike the
// roll-up, the feed RESPECTS the guards: a closed recording period or an
// approval-locked quarter is skipped and reported, never overwritten.
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  DataSourceCellValue,
  DataSourceColumn,
  DataSourceLinkMapping,
} from "@/lib/types";
import type { AggregateParts } from "@/lib/kpi/dataSourceFilters";
import { aggregateParts, matchesFilters } from "@/lib/kpi/dataSourceFilters";
import { isApprovalDataLocked } from "@/lib/kpi/approvalWorkflow";
import { getApprovalState } from "@/lib/kpi/approvalServer";
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
  /** Quarters whose stored value was emptied because the link can no longer
   *  produce one there — see applyLink. */
  cleared: number;
  skipped: FeedSkip[];
}

const empty = (): FeedOutcome => ({ updated: 0, cleared: 0, skipped: [] });

const merge = (a: FeedOutcome, b: FeedOutcome): FeedOutcome => ({
  updated: a.updated + b.updated,
  cleared: a.cleared + b.cleared,
  skipped: [...a.skipped, ...b.skipped],
});

/** Short human summary for a toast. */
export function describeOutcome(outcome: FeedOutcome): string {
  const parts = [`${outcome.updated} quarter${outcome.updated === 1 ? "" : "s"} updated`];

  // Only worth saying when it happened: clearing is rare, and a "0 cleared" on
  // every ordinary save would read as though something were wrong.
  if (outcome.cleared > 0) parts.push(`${outcome.cleared} cleared`);

  if (outcome.skipped.length > 0) {
    const byReason = new Map<string, number>();
    for (const s of outcome.skipped) {
      byReason.set(s.reason, (byReason.get(s.reason) ?? 0) + 1);
    }
    const detail = [...byReason.entries()]
      .map(([reason, n]) => `${n} ${reason}`)
      .join(", ");
    parts.push(`${outcome.skipped.length} skipped (${detail})`);
  }
  return parts.join(" · ");
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
            r.start_year AS startYear
       FROM perf_kpi k
       JOIN performance_record r ON r.id = k.record_id AND r.status = 'active'
      WHERE k.source_kpi_id = ?`,
    [link.libraryKpiId],
  );
  // Metrics are no bar: linking a KPI to a data source is a statement that the
  // source owns its value, and recomputeKpiQuarter defers to it (see
  // rollsUpFromChildren in lib/kpi/performance.ts). A link can express what no
  // calculation_type can — a faculty-headcount denominator, or a filter the
  // children don't share — which is exactly why one gets authored on a KPI that
  // already has sub-KPIs.
  return rows.map((r) => ({
    perfKpiId: Number(r.perfKpiId),
    perfMetricId: null,
    recordId: Number(r.recordId),
    startYear: Number(r.startYear),
    unit: r.unit ?? null,
    name: r.name,
  }));
}

/** Empty the value a previous feed left on one quarter, keeping the row (and its
 *  issue/solution) in place. Returns whether anything was actually cleared.
 *
 *  `is_computed = 1` is the safety rule: a hand-entered number was never this
 *  link's to write, so it is never this link's to erase. The KPI row also takes
 *  value_source, since an empty row still belongs to the source that owns it. */
async function clearComputedQuarter(
  conn: PoolConnection,
  target: Target,
  yearNo: number,
  quarterNo: number,
): Promise<boolean> {
  const [res] =
    target.perfMetricId != null
      ? await conn.query<ResultSetHeader>(
          `UPDATE perf_metric_quarter_progress
              SET progress_value = NULL, variable1_value = NULL, variable2_value = NULL
            WHERE perf_metric_id = ? AND year_no = ? AND quarter_no = ?
              AND is_computed = 1 AND progress_value IS NOT NULL`,
          [target.perfMetricId, yearNo, quarterNo],
        )
      : await conn.query<ResultSetHeader>(
          `UPDATE perf_kpi_quarter_progress
              SET progress_value = NULL, variable1_value = NULL, variable2_value = NULL,
                  value_source = 'data_source'
            WHERE perf_kpi_id = ? AND year_no = ? AND quarter_no = ?
              AND is_computed = 1 AND progress_value IS NOT NULL`,
          [target.perfKpiId, yearNo, quarterNo],
        );
  return res.affectedRows > 0;
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

        // Decide the guards once: they gate writing AND clearing alike, so a
        // closed or approval-locked quarter is never touched in either
        // direction.
        let block: string | null = null;
        if (!open.has(`${yearNo}:${quarterNo}`)) {
          block = "period closed";
        } else {
          const state = await getApprovalState(conn, target.perfKpiId, yearNo, quarterNo);
          if (isApprovalDataLocked(state)) {
            block = state === "approved" ? "approved" : "under review";
          }
        }

        if (rows.length === 0) {
          // No rows to compute from. If this link wrote a value here earlier —
          // before its source rows were re-dated or removed — nothing else will
          // ever rewrite it: the roll-up defers to the link and the manual PUT
          // only touches hand-entered rows. So clear it rather than leave a
          // number that outlived the data behind it.
          if (!block && (await clearComputedQuarter(conn, target, yearNo, quarterNo))) {
            outcome.cleared += 1;
            // A rolled-up parent has to follow its children down. A link-owned
            // parent no-ops here (rollsUpFromChildren) and is cleared by its
            // own link's pass instead.
            if (target.perfMetricId != null) {
              await recomputeKpiQuarter(conn, target.perfKpiId, yearNo, quarterNo);
            }
          }
          continue;
        }

        // Reported only on this path: a closed quarter that had nothing to write
        // anyway is not a skip worth counting, and folding those in would swamp
        // the toast.
        if (block) {
          outcome.skipped.push({ target: target.name, yearNo, quarterNo, reason: block });
          continue;
        }

        // One mapping per link, so one aggregation per quarter. It already
        // carries its own numerator and denominator (a proportion's two sides,
        // an average's total and row count), which is what both progress tables
        // record alongside the value.
        const mapping = link.mappings[0];
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
        const parts: AggregateParts = aggregateParts(
          mapping.aggregation,
          mapping.columnKey,
          matched,
          proportion,
        );

        if (target.perfMetricId != null) {
          // The parent KPI derives its own pair from the roll-up, not from these.
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
              parts.value,
              parts.numerator,
              parts.denominator,
            ],
          );
          // Let the existing roll-up carry the change up to the parent KPI.
          await recomputeKpiQuarter(conn, target.perfKpiId, yearNo, quarterNo);
        } else {
          // The aggregation's own numerator/denominator ARE the KPI's Variable 1
          // and Variable 2 — "96 of 120 → 80%" — so a fed percent reads with the
          // same basis a hand-entered one would.
          await conn.query(
            `INSERT INTO perf_kpi_quarter_progress
               (perf_kpi_id, year_no, quarter_no, progress_value, variable1_value, variable2_value,
                is_computed, value_source)
             VALUES (?, ?, ?, ?, ?, ?, 1, 'data_source')
             ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value),
               variable1_value = VALUES(variable1_value),
               variable2_value = VALUES(variable2_value),
               is_computed = 1, value_source = 'data_source'`,
            [
              target.perfKpiId,
              yearNo,
              quarterNo,
              parts.value,
              parts.numerator,
              parts.denominator,
            ],
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
