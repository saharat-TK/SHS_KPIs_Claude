// Server-only helpers for data sources. Never import from a "use client"
// component — it pulls in the MySQL pool.
import { NextResponse } from "next/server";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type {
  DataSourceColumn,
  DataSourceEntry,
  DataSourceLink,
  DataSourceLinkMapping,
  Role,
} from "@/lib/types";
import { DataSourceValidationError } from "@/lib/kpi/dataSources";
import { validateMappings } from "@/lib/kpi/dataSourceFilters";
import { loadAcademicCatalog } from "@/lib/kpi/academicCatalogServer";

type Db = Pool | PoolConnection;

/** Bad input answers 400 with its message; anything else is a real failure. */
export function errorResponse(err: unknown, fallback: string) {
  if (err instanceof DataSourceValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : fallback },
    { status: 500 },
  );
}

export const DATA_SOURCE_SELECT = `
  d.id, d.name, d.description, d.committee_id AS committeeId,
  d.period_grain AS periodGrain, d.status,
  d.created_by AS createdBy, d.created_at AS createdAt, d.updated_at AS updatedAt,
  c.name AS committeeName,
  (SELECT COUNT(*) FROM data_source_column x WHERE x.data_source_id = d.id) AS columnCount,
  (SELECT COUNT(*) FROM data_source_entry e WHERE e.data_source_id = d.id) AS entryCount,
  (SELECT COUNT(*) FROM data_source_link l WHERE l.data_source_id = d.id) AS linkCount,
  (SELECT MAX(e.created_at) FROM data_source_entry e WHERE e.data_source_id = d.id) AS lastEntryAt
`;

export const DATA_SOURCE_FROM = `
  FROM data_source d
  LEFT JOIN committees c ON c.id = d.committee_id
`;

export const COLUMN_SELECT = `
  id, data_source_id AS dataSourceId, col_key AS colKey, label,
  data_type AS dataType, unit, options, is_required AS isRequired,
  sort_order AS sortOrder
`;

/** mysql2 returns JSON columns as objects on MySQL but as strings on MariaDB
 *  (where JSON is a LONGTEXT alias). Normalise both to a parsed value. */
export function parseJsonColumn<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function mapColumnRow(row: RowDataPacket): DataSourceColumn {
  return {
    id: Number(row.id),
    dataSourceId: Number(row.dataSourceId),
    colKey: row.colKey,
    label: row.label,
    dataType: row.dataType,
    unit: row.unit ?? null,
    options: parseJsonColumn<string[] | null>(row.options, null),
    isRequired: !!row.isRequired,
    sortOrder: Number(row.sortOrder),
  };
}

export const ENTRY_SELECT = `
  e.id, e.data_source_id AS dataSourceId, e.year, e.quarter,
  e.values_json AS valuesJson, e.note, e.recorded_by AS recordedBy,
  e.created_at AS createdAt, e.updated_at AS updatedAt,
  f.name AS recordedByName
`;

export const ENTRY_FROM = `
  FROM data_source_entry e
  LEFT JOIN faculty f ON f.id = e.recorded_by
`;

export function mapEntryRow(row: RowDataPacket): DataSourceEntry {
  return {
    id: Number(row.id),
    dataSourceId: Number(row.dataSourceId),
    year: Number(row.year),
    quarter: row.quarter == null ? null : Number(row.quarter),
    values: parseJsonColumn(row.valuesJson, {}),
    note: row.note ?? null,
    recordedBy: row.recordedBy ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    recordedByName: row.recordedByName ?? undefined,
  };
}

export const LINK_SELECT = `
  l.id, l.data_source_id AS dataSourceId,
  l.library_kpi_id AS libraryKpiId, l.library_metric_id AS libraryMetricId,
  l.mappings, l.note,
  k.name AS kpiName, m.name AS metricName, s.name AS setName,
  d.name AS dataSourceName
`;

/** A link targets a KPI directly, or a metric (whose parent KPI gives the set). */
export const LINK_FROM = `
  FROM data_source_link l
  LEFT JOIN data_source   d ON d.id = l.data_source_id
  LEFT JOIN library_metric m ON m.id = l.library_metric_id
  LEFT JOIN library_kpi    k ON k.id = COALESCE(l.library_kpi_id, m.kpi_id)
  LEFT JOIN strategic_set  s ON s.id = k.set_id
`;

export function mapLinkRow(row: RowDataPacket): DataSourceLink {
  return {
    id: Number(row.id),
    dataSourceId: Number(row.dataSourceId),
    libraryKpiId: row.libraryKpiId == null ? null : Number(row.libraryKpiId),
    libraryMetricId: row.libraryMetricId == null ? null : Number(row.libraryMetricId),
    mappings: parseJsonColumn<DataSourceLinkMapping[]>(row.mappings, []),
    note: row.note ?? null,
    kpiName: row.kpiName ?? undefined,
    metricName: row.metricName ?? undefined,
    setName: row.setName ?? undefined,
    dataSourceName: row.dataSourceName ?? undefined,
  };
}

/** Validate a link's mappings against the source's own columns and grain.
 *  Rethrows as DataSourceValidationError so errorResponse answers 400. */
export async function validateLinkMappings(
  db: Db,
  dataSourceId: number | string,
  raw: unknown,
): Promise<DataSourceLinkMapping[]> {
  const source = await loadSourceShape(db, dataSourceId);
  if (!source) throw new DataSourceValidationError("Data source not found");

  const columns = await resolveColumnOptions(db, source.columns);
  try {
    return validateMappings(columns, source.periodGrain, raw);
  } catch (err) {
    throw new DataSourceValidationError(
      err instanceof Error ? err.message : "Invalid filter",
    );
  }
}

/** Fill in `options` for derived-option columns so validateEntryValues can check them
 *  the same way it checks a `select`. Faculty ids come from the live roster (active
 *  staff only); program and curriculum codes from the academic catalog tables.
 *  Nothing here is persisted — data_source_column.options stays NULL for these types.
 *
 *  Call this immediately before validating an entry write. */
export async function resolveColumnOptions(
  db: Db,
  columns: DataSourceColumn[],
): Promise<DataSourceColumn[]> {
  // Only pay for the roster query when a faculty column is actually present.
  let facultyIds: string[] | null = null;
  if (columns.some((c) => c.dataType === "faculty")) {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM faculty WHERE status = 'active'",
    );
    facultyIds = rows.map((r) => String(r.id));
  }

  // Likewise for the catalog — one load covers both program and curriculum.
  const needsCatalog = columns.some(
    (c) => c.dataType === "program" || c.dataType === "curriculum",
  );
  const catalog = needsCatalog ? await loadAcademicCatalog(db) : null;

  return columns.map((c) => {
    if (c.dataType === "faculty") return { ...c, options: facultyIds ?? [] };
    if (c.dataType === "program") {
      return { ...c, options: catalog?.programs.map((p) => p.code) ?? [] };
    }
    if (c.dataType === "curriculum") {
      return { ...c, options: catalog?.curricula.map((x) => x.code) ?? [] };
    }
    return c;
  });
}

/** Load a data source's shape (grain + columns), or null when it doesn't exist. */
export async function loadSourceShape(
  db: Db,
  dataSourceId: number | string,
): Promise<{
  id: number;
  committeeId: string;
  periodGrain: "quarterly" | "annual";
  status: "active" | "archived";
  columns: DataSourceColumn[];
} | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, committee_id AS committeeId, period_grain AS periodGrain, status
       FROM data_source WHERE id = ?`,
    [dataSourceId],
  );
  if (rows.length === 0) return null;

  const [cols] = await db.query<RowDataPacket[]>(
    `SELECT ${COLUMN_SELECT} FROM data_source_column
      WHERE data_source_id = ? ORDER BY sort_order, id`,
    [dataSourceId],
  );

  return {
    id: Number(rows[0].id),
    committeeId: rows[0].committeeId,
    periodGrain: rows[0].periodGrain,
    status: rows[0].status,
    columns: cols.map(mapColumnRow),
  };
}

/** Mirror of lib/auth/can.ts for entry writes, applied server-side.
 *
 *  The app has no session layer — routes trust the client-supplied actorId /
 *  userRole exactly as app/api/perf-kpis/[id]/progress/route.ts does. This is a
 *  consistency guard, not a security boundary; real enforcement needs authn.
 *
 *  Returns an error message, or null when the write is allowed. */
export async function checkEntryWriteAccess(
  db: Db,
  source: { committeeId: string; status: string },
  actorId: string | null,
  userRole: Role | undefined,
): Promise<string | null> {
  if (source.status === "archived") {
    return "This data source is archived and no longer accepts entries";
  }
  if (userRole === "admin") return null;
  if (userRole !== "committee") {
    return "Your role cannot record data source entries";
  }
  if (!actorId) return "An actor is required to record entries";

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 1 FROM committee_memberships WHERE faculty_id = ? AND committee_id = ?`,
    [actorId, source.committeeId],
  );
  return rows.length > 0
    ? null
    : "You can only record data for your own committee's data sources";
}
