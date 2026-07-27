"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Button,
  Badge,
  Tabs,
  QueryBoundary,
  EmptyState,
  SearchInput,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  useDataSource,
  useDataSourceColumns,
  useDataSourceEntries,
  useFacultyRecords,
} from "@/lib/data/hooks";
import { formatCellValue, formatEntryPeriod } from "@/lib/kpi/dataSources";
import { buildCellLabels } from "@/lib/kpi/programs";
import { downloadCsv, toCsv } from "@/lib/csv";
import type {
  DataSourceEntry,
  PerfKpi,
  PerfKpiSource,
  PerfMetric,
} from "@/lib/types";
import { LinkDataSourceModal } from "./LinkDataSourceModal";
import {
  EntriesTable,
  formatEntryCreatedAt,
} from "@/app/(app)/kpi-management/data-sources/[dataSourceId]/EntriesTable";
import { EntryModal } from "@/app/(app)/kpi-management/data-sources/[dataSourceId]/EntryModal";

/** Roughly ten rows plus the sticky header — a literal class, because Tailwind
 *  only emits arbitrary values it can see in the source. */
const TEN_ROW_HEIGHT = "max-h-[28rem]";

/** The raw data behind this KPI, edited in place. Read/record only: columns are
 *  defined and sources created on the Data Sources page, not here. */
export function LinkedDataSourcesSection({
  kpi,
  sources,
  metrics,
  isLoading,
  isError,
}: {
  kpi: PerfKpi;
  sources: PerfKpiSource[];
  metrics: PerfMetric[];
  isLoading: boolean;
  isError: boolean;
}) {
  const { can } = useAuth();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [linking, setLinking] = useState(false);
  // Fall back to the first source until one is picked, so the tab strip and the
  // table agree even before any interaction.
  const active = sources.find((s) => s.id === activeId) ?? sources[0] ?? null;

  // A link edits the LIBRARY KPI and refeeds every active record, so it takes the
  // same permission the Data Sources page requires to create one.
  const canLink = can("configure_kpis");
  const linkedSourceIds = sources.map((s) => s.id);

  return (
    <Card className="overflow-visible">
      <div className="flex items-start justify-between gap-md border-b border-hairline px-md py-md">
        <div className="flex flex-col gap-tiny">
          <h3 className="text-heading-md text-on-surface">Linked Data Sources</h3>
          <p className="text-caption-sm text-mute">
            The raw data behind this KPI. Edit it here and the computed values follow.
          </p>
        </div>
        {canLink && sources.length > 0 && (
          <Button
            variant="outline"
            icon="add_link"
            className="shrink-0"
            onClick={() => setLinking(true)}
          >
            Link Data Source
          </Button>
        )}
      </div>

      <QueryBoundary isLoading={isLoading} isError={isError}>
        {sources.length === 0 ? (
          <EmptyState
            icon="database"
            title="No data source linked"
            message={
              canLink
                ? "Nothing feeds this KPI yet. Linking a source applies to the KPI everywhere, across every performance record."
                : "Nothing feeds this KPI yet. An administrator can link one from here or from the Data Sources page."
            }
            action={
              canLink ? (
                <Button icon="add_link" onClick={() => setLinking(true)}>
                  Link Data Source
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {sources.length > 1 && (
              <div className="px-md pt-md">
                <Tabs
                  active={String(active?.id ?? "")}
                  onChange={(id) => setActiveId(Number(id))}
                  items={sources.map((s) => ({
                    id: String(s.id),
                    label: s.name,
                    count: s.links.length,
                  }))}
                />
              </div>
            )}
            {active && (
              <SourcePanel
                key={active.id}
                source={active}
                metrics={metrics}
              />
            )}
          </>
        )}
      </QueryBoundary>

      {linking && (
        <LinkDataSourceModal
          open
          onClose={() => setLinking(false)}
          kpi={kpi}
          metrics={metrics}
          linkedSourceIds={linkedSourceIds}
        />
      )}
    </Card>
  );
}

function SourcePanel({
  source,
  metrics,
}: {
  source: PerfKpiSource;
  metrics: PerfMetric[];
}) {
  const { can, user } = useAuth();
  const detailQ = useDataSource(source.id);
  const columnsQ = useDataSourceColumns(source.id);
  const entriesQ = useDataSourceEntries(source.id);
  const facultyQ = useFacultyRecords();

  const [editing, setEditing] = useState<DataSourceEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [findData, setFindData] = useState("");

  const columns = useMemo(() => columnsQ.data ?? [], [columnsQ.data]);
  const entries = entriesQ.data ?? [];
  const cellLabels = useMemo(
    () => buildCellLabels(facultyQ.data ?? []),
    [facultyQ.data],
  );

  // Scoped to the DATA SOURCE's committee, not the performance record's.
  const canRecord = can("submit_metrics", { committeeId: source.committeeId });

  // Why this source is attached: the KPI itself, and/or named metrics.
  const feedsKpi = source.links.some((l) => l.libraryKpiId != null);
  const fedMetricNames = metrics
    .filter((m) =>
      source.links.some(
        (l) => l.libraryMetricId != null && l.libraryMetricId === m.sourceMetricId,
      ),
    )
    .map((m) => m.name);

  const exportCsv = () => {
    const headers = ["Period", ...columns.map((c) => c.label), "Note", "Created at"];
    const rows = entries.map((e) => [
      formatEntryPeriod(e.year, e.quarter),
      ...columns.map((c) => formatCellValue(c, e.values[c.colKey] ?? null, cellLabels)),
      e.note ?? "",
      formatEntryCreatedAt(e.createdAt),
    ]);
    downloadCsv(
      `${source.name.replace(/\s+/g, "-").toLowerCase()}.csv`,
      toCsv(headers, rows),
    );
  };

  return (
    <>
      <div className="flex flex-col gap-sm px-md py-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-tiny">
          {/* Named here, not only in the tab strip — that only renders for two
              or more sources, so a single linked source was otherwise unnamed. */}
          <h4 className="truncate text-label-md text-on-surface">{source.name}</h4>
          <div className="flex min-w-0 flex-wrap items-center gap-sm text-body-sm text-mute">
            <Badge tone={source.status === "active" ? "success" : "neutral"}>
              {source.status}
            </Badge>
            <span className="min-w-0 truncate">
              {source.committeeName ?? source.committeeId}
            </span>
            <span>·</span>
            <span>{source.periodGrain} entries</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-sm">
          {entries.length > 0 && (
            <Button variant="ghost" icon="download" onClick={exportCsv}>
              Export CSV
            </Button>
          )}
          {canRecord && columns.length > 0 && (
            <Button icon="add" onClick={() => setAdding(true)}>
              Add Entry
            </Button>
          )}
        </div>
      </div>

      <p className="flex items-start gap-xs px-md pb-md text-caption-sm text-mute">
        <Icon name="link" className="mt-tiny shrink-0 text-[16px]" />
        <span>
          Feeds{" "}
          {feedsKpi && <span className="font-medium">this KPI</span>}
          {feedsKpi && fedMetricNames.length > 0 && " and "}
          {fedMetricNames.length > 0 && (
            <span className="font-medium">
              {fedMetricNames.length} sub-KPI
              {fedMetricNames.length === 1 ? "" : "s"}
            </span>
          )}
          {fedMetricNames.length > 0 && ` (${fedMetricNames.join(", ")})`}
          {!feedsKpi && fedMetricNames.length === 0 && "nothing yet — evidence only"}.
        </span>
      </p>

      {columns.length > 0 && (
        <div className="px-md pb-md">
          <div className="w-full sm:w-80">
            <SearchInput
              aria-label="Find data"
              placeholder="Find data"
              value={findData}
              onChange={(event) => setFindData(event.target.value)}
            />
          </div>
        </div>
      )}

      <QueryBoundary
        isLoading={columnsQ.isLoading || entriesQ.isLoading}
        isError={columnsQ.isError || entriesQ.isError}
      >
        {columns.length === 0 ? (
          <EmptyState
            icon="view_column"
            title="No columns defined yet"
            message="This data source has no columns, so there is nothing to record. Define them on the Data Sources page."
          />
        ) : entries.length === 0 ? (
          <EmptyState
            icon="table_rows"
            title="No data recorded yet"
            message={
              canRecord
                ? "Add the first entry for this data source."
                : "Only this data source's committee can record entries."
            }
            action={
              canRecord ? (
                <Button icon="add" onClick={() => setAdding(true)}>
                  Add Entry
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EntriesTable
            columns={columns}
            entries={entries}
            canRecord={canRecord}
            dataSourceId={source.id}
            actor={{ actorId: user?.facultyId, userRole: user?.role }}
            cellLabels={cellLabels}
            query={findData}
            onEdit={setEditing}
            heightClass={TEN_ROW_HEIGHT}
          />
        )}
      </QueryBoundary>

      {(adding || editing) && detailQ.data && (
        <EntryModal
          open
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          dataSourceId={source.id}
          periodGrain={detailQ.data.periodGrain}
          columns={columns}
          entry={editing}
        />
      )}
    </>
  );
}
