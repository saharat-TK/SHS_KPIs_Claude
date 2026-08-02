"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Button,
  Badge,
  Tabs,
  QueryBoundary,
  EmptyState,
  HoverPopover,
  SearchInput,
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  useDataSource,
  useDataSourceColumns,
  useDataSourceEntries,
  useDeleteDataSourceLink,
  useFacultyRecords,
  useAcademicCatalog,
} from "@/lib/data/hooks";
import { formatCellValue, formatEntryPeriod } from "@/lib/kpi/dataSources";
import { buildCellLabels } from "@/lib/kpi/academicCatalog";
import { downloadCsv, toCsv } from "@/lib/csv";
import type {
  DataSourceEntry,
  DataSourceLink,
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
  const [editingLink, setEditingLink] = useState<DataSourceLink | null>(null);
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
        <div className="flex shrink-0 items-center gap-sm">
          {/* Not gated on canLink: reading what feeds the KPI is not an admin
              action. The edit/unlink buttons inside the panel are gated. */}
          {active && (
            <HoverPopover
              label={`Feeds from ${active.name}`}
              panelClassName="border-primary/20 bg-[#eff8e8]"
              trigger={(aria) => (
                <Button {...aria} variant="ghost" icon="link">
                  Feeds · {active.links.length}
                </Button>
              )}
            >
              {({ close }) => (
                <LinksList
                  links={active.links}
                  canLink={canLink}
                  dataSourceId={active.id}
                  onEdit={(link) => {
                    close();
                    setEditingLink(link);
                  }}
                />
              )}
            </HoverPopover>
          )}
          {canLink && sources.length > 0 && (
            <Button variant="outline" icon="add_link" onClick={() => setLinking(true)}>
              Link Data Source
            </Button>
          )}
        </div>
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
            {active && <SourcePanel key={active.id} source={active} />}
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

      {editingLink && (
        <LinkDataSourceModal
          open
          onClose={() => setEditingLink(null)}
          kpi={kpi}
          metrics={metrics}
          linkedSourceIds={[]}
          link={editingLink}
        />
      )}
    </Card>
  );
}

/** One source's raw entries. Knows nothing about links — the feeds list and its
 *  actions live in the section header's pop-up. */
function SourcePanel({ source }: { source: PerfKpiSource }) {
  const { can, user } = useAuth();
  const detailQ = useDataSource(source.id);
  const columnsQ = useDataSourceColumns(source.id);
  const entriesQ = useDataSourceEntries(source.id);
  const facultyQ = useFacultyRecords();
  const catalogQ = useAcademicCatalog();

  const [editing, setEditing] = useState<DataSourceEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [findData, setFindData] = useState("");

  const columns = useMemo(() => columnsQ.data ?? [], [columnsQ.data]);
  const entries = entriesQ.data ?? [];
  const cellLabels = useMemo(
    () => buildCellLabels(facultyQ.data ?? [], catalogQ.data),
    [facultyQ.data, catalogQ.data],
  );

  // Scoped to the DATA SOURCE's committee, not the performance record's.
  const canRecord = can("submit_metrics", { committeeId: source.committeeId });

  // The entry dialog needs the source's period grain, which only useDataSource
  // carries — sourcesByKpi does not. Until it lands, Add Entry would open
  // nothing, so disable it rather than swallowing the click.
  const detailReady = !!detailQ.data;
  const addEntryTitle = detailReady ? undefined : "Loading this data source…";

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
            <Button
              icon="add"
              disabled={!detailReady}
              title={addEntryTitle}
              onClick={() => setAdding(true)}
            >
              Add Entry
            </Button>
          )}
        </div>
      </div>


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
                <Button
                  icon="add"
                  disabled={!detailReady}
                  title={addEntryTitle}
                  onClick={() => setAdding(true)}
                >
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
          entries={entries}
        />
      )}
    </>
  );
}

/** A compact, actionable list of the active source's targets. */
function LinksList({
  links,
  canLink,
  dataSourceId,
  onEdit,
}: {
  links: DataSourceLink[];
  canLink: boolean;
  dataSourceId: number;
  onEdit: (link: DataSourceLink) => void;
}) {
  const confirm = useConfirm();
  const remove = useDeleteDataSourceLink();

  if (links.length === 0) return null;

  return (
    <div className="flex flex-col gap-xs p-sm">
      {links.map((l) => (
        <div
          key={l.id}
          className="flex items-center gap-xs rounded-md px-sm py-xs text-body-sm text-on-surface transition-colors hover:bg-[#d9edc8] focus-within:bg-[#d9edc8]"
        >
          {canLink ? (
            <button
              type="button"
              onClick={() => onEdit(l)}
              className="min-w-0 flex-1 truncate rounded-sm text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
              aria-label={`Edit feed for ${l.metricName ?? l.kpiName ?? "this KPI"}`}
            >
              Feeds {l.metricName ?? l.kpiName ?? "this KPI"}
            </button>
          ) : (
            <span className="min-w-0 flex-1 truncate font-medium">
              Feeds {l.metricName ?? l.kpiName ?? "this KPI"}
            </span>
          )}

          {canLink && (
            <button
              type="button"
              aria-label="Remove link"
              title="Remove link"
              onClick={async () => {
                const ok = await confirm({
                  title: "Remove this link?",
                  message:
                    "The raw data stays; only the link to the KPI is removed. Values it already fed keep their last computed number.",
                  tone: "danger",
                  confirmLabel: "Remove",
                });
                if (ok) remove.mutate({ dataSourceId, linkId: l.id });
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-mute transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            >
              <Icon name="link_off" className="text-[18px]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
