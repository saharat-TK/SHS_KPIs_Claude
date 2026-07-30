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
import { describeMapping } from "@/lib/kpi/dataSourceFilters";
import { buildCellLabels } from "@/lib/kpi/academicCatalog";
import { downloadCsv, toCsv } from "@/lib/csv";
import type {
  DataSourceColumn,
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

  // The feeds panel describes the active source's mappings, so it needs that
  // source's columns and the shared code→name labels. SourcePanel asks for the
  // same three; these are react-query hooks keyed by id, so both callers share
  // one fetch rather than duplicating it.
  const activeColumnsQ = useDataSourceColumns(active?.id ?? 0);
  const facultyQ = useFacultyRecords();
  const catalogQ = useAcademicCatalog();
  const activeColumns = useMemo(() => activeColumnsQ.data ?? [], [activeColumnsQ.data]);
  // Labels take no data source — faculty ids and catalog codes are global.
  const cellLabels = useMemo(
    () => buildCellLabels(facultyQ.data ?? [], catalogQ.data),
    [facultyQ.data, catalogQ.data],
  );

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
              trigger={(aria) => (
                <Button {...aria} variant="ghost" icon="link">
                  Feeds · {active.links.length}
                </Button>
              )}
            >
              <div className="border-b border-hairline px-md py-sm">
                {/* Named because the panel shows ONE source's links, and with a
                    tab strip it would otherwise be unclear which. */}
                <p className="text-label-md text-on-surface">{active.name}</p>
                <p className="text-caption-sm text-mute">
                  What this source feeds, and how each value is derived.
                </p>
              </div>
              <LinksList
                links={active.links}
                columns={activeColumns}
                cellLabels={cellLabels}
                canLink={canLink}
                dataSourceId={active.id}
                onEdit={setEditingLink}
              />
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

/** Why this source is attached, one row per link, with the same edit/unlink
 *  affordances the Data Sources page offers — the two pages should not disagree
 *  about what you can do to a link. Rendered inside the header's feeds pop-up. */
function LinksList({
  links,
  columns,
  cellLabels,
  canLink,
  dataSourceId,
  onEdit,
}: {
  links: DataSourceLink[];
  columns: DataSourceColumn[];
  cellLabels: Record<string, string>;
  canLink: boolean;
  dataSourceId: number;
  onEdit: (link: DataSourceLink) => void;
}) {
  const confirm = useConfirm();
  const remove = useDeleteDataSourceLink();

  if (links.length === 0) return null;

  return (
    <div className="flex flex-col gap-xs p-md">
      {links.map((l) => (
        <div
          key={l.id}
          className="flex items-start justify-between gap-sm text-caption-sm text-mute"
        >
          <p className="flex min-w-0 items-start gap-xs">
            <Icon name="link" className="mt-tiny shrink-0 text-[16px]" />
            <span className="min-w-0">
              Feeds{" "}
              <span className="font-medium text-on-surface">
                {l.metricName ?? l.kpiName ?? "this KPI"}
              </span>
              {l.mappings.length === 0 ? (
                <> — evidence only, it changes no value.</>
              ) : (
                <>
                  {" — "}
                  {l.mappings.map((m, i) => (
                    <span key={i}>
                      {i > 0 && "; "}
                      {m.slot !== "value" && <Badge tone="neutral">{m.slot}</Badge>}{" "}
                      {describeMapping(m, columns, cellLabels)}
                    </span>
                  ))}
                </>
              )}
            </span>
          </p>

          {canLink && (
            <div className="inline-flex shrink-0 items-center gap-xxs">
              <button
                type="button"
                aria-label="Edit link"
                title="Edit link"
                onClick={() => onEdit(l)}
                className="grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="edit" className="text-[18px]" />
              </button>
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
                className="grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
              >
                <Icon name="link_off" className="text-[18px]" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
