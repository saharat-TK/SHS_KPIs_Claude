"use client";

import { useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Button,
  Badge,
  Tabs,
  QueryBoundary,
  EmptyState,
  useConfirm,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  useDataSource,
  useDataSourceColumns,
  useDataSourceEntries,
  useDataSourceLinks,
  useDeleteDataSourceEntry,
  useDeleteDataSourceLink,
  useFacultyRecords,
} from "@/lib/data/hooks";
import { formatCellValue, formatEntryPeriod } from "@/lib/kpi/dataSources";
import { describeMapping } from "@/lib/kpi/dataSourceFilters";
import { buildCellLabels } from "@/lib/kpi/programs";
import { downloadCsv, toCsv } from "@/lib/csv";
import { Icon } from "@/components/ui/Icon";
import type { DataSourceColumn, DataSourceEntry, DataSourceLink } from "@/lib/types";
import { EntryModal } from "./EntryModal";
import { LinkKpiModal } from "./LinkKpiModal";
import { ManageColumnsModal } from "./ManageColumnsModal";

export default function DataSourceDetailPage({
  params,
}: {
  params: { dataSourceId: string };
}) {
  return (
    <RequirePermission action="view_dashboards">
      <DataSourceDetail id={Number(params.dataSourceId)} />
    </RequirePermission>
  );
}

function DataSourceDetail({ id }: { id: number }) {
  const { can, user } = useAuth();
  const sourceQ = useDataSource(id);
  const columnsQ = useDataSourceColumns(id);
  const linksQ = useDataSourceLinks(id);
  const [tab, setTab] = useState("data");
  const [showColumns, setShowColumns] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [editing, setEditing] = useState<DataSourceEntry | null>(null);
  const [editingLink, setEditingLink] = useState<DataSourceLink | null>(null);
  const [adding, setAdding] = useState(false);

  const source = sourceQ.data;
  const columns = useMemo(() => columnsQ.data ?? [], [columnsQ.data]);
  const links = linksQ.data ?? [];

  useBreadcrumbLabel(
    `/kpi-management/data-sources/${id}`,
    source?.name ?? undefined,
  );

  const isAdmin = can("configure_kpis");
  // can() already blocks a committee user acting on another committee.
  const canRecord = !!source && can("submit_metrics", { committeeId: source.committeeId });

  const entriesQ = useDataSourceEntries(id);
  const entries = entriesQ.data ?? [];

  // Derived cells store a code (faculty id, program abbr); the table and the CSV
  // both resolve it through this one map so the two always agree.
  const facultyQ = useFacultyRecords();
  const cellLabels = useMemo(
    () => buildCellLabels(facultyQ.data ?? []),
    [facultyQ.data],
  );

  const exportCsv = () => {
    if (!source) return;
    const headers = ["Period", ...columns.map((c) => c.label), "Note", "Recorded by"];
    const rows = entries.map((e) => [
      formatEntryPeriod(e.year, e.quarter),
      ...columns.map((c) => formatCellValue(c, e.values[c.colKey] ?? null, cellLabels)),
      e.note ?? "",
      e.recordedByName ?? "",
    ]);
    downloadCsv(`${source.name.replace(/\s+/g, "-").toLowerCase()}.csv`, toCsv(headers, rows));
  };

  return (
    <QueryBoundary isLoading={sourceQ.isLoading} isError={sourceQ.isError}>
      {!source ? null : (
        <>
          <PageHeader
            title={source.name}
            description={
              source.description ??
              `Raw data owned by ${source.committeeName ?? source.committeeId}.`
            }
            actions={
              <div className="flex items-center gap-sm">
                {entries.length > 0 && (
                  <Button variant="ghost" icon="download" onClick={exportCsv}>
                    Export CSV
                  </Button>
                )}
                {tab === "data" && canRecord && columns.length > 0 && (
                  <Button icon="add" onClick={() => setAdding(true)}>
                    Add Entry
                  </Button>
                )}
                {tab === "columns" && isAdmin && (
                  <Button icon="edit" onClick={() => setShowColumns(true)}>
                    Manage Columns
                  </Button>
                )}
                {tab === "links" && isAdmin && (
                  <Button icon="add_link" onClick={() => setShowLink(true)}>
                    Link KPI
                  </Button>
                )}
              </div>
            }
          />

          <div className="mb-md flex flex-wrap items-center gap-sm text-body-sm text-mute">
            <Badge tone={source.status === "active" ? "success" : "neutral"}>
              {source.status}
            </Badge>
            <span>{source.committeeName ?? source.committeeId}</span>
            <span>·</span>
            <span>{source.periodGrain} entries</span>
          </div>

          <Tabs
            className="mb-md"
            active={tab}
            onChange={setTab}
            items={[
              { id: "data", label: "Data", count: entries.length },
              { id: "columns", label: "Columns", count: columns.length },
              { id: "links", label: "Linked KPIs", count: links.length },
            ]}
          />

          {tab === "data" && (
            <Card className="overflow-hidden">
              <QueryBoundary isLoading={entriesQ.isLoading} isError={entriesQ.isError}>
                {columns.length === 0 ? (
                  <EmptyState
                    icon="view_column"
                    title="No columns defined yet"
                    message="This data source needs columns before anyone can record data against it."
                    action={
                      isAdmin ? (
                        <Button icon="edit" onClick={() => setShowColumns(true)}>
                          Manage Columns
                        </Button>
                      ) : undefined
                    }
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
                    dataSourceId={id}
                    actor={{ actorId: user?.facultyId, userRole: user?.role }}
                    cellLabels={cellLabels}
                    onEdit={setEditing}
                  />
                )}
              </QueryBoundary>
            </Card>
          )}

          {tab === "columns" && (
            <Card className="overflow-hidden">
              {columns.length === 0 ? (
                <EmptyState
                  icon="view_column"
                  title="No columns defined yet"
                  message="Columns describe what this data source collects."
                  action={
                    isAdmin ? (
                      <Button icon="edit" onClick={() => setShowColumns(true)}>
                        Manage Columns
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Label</Th>
                      <Th>Stored as</Th>
                      <Th align="center">Type</Th>
                      <Th align="center">Unit</Th>
                      <Th align="center">Required</Th>
                      <Th>Options</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((c) => (
                      <tr key={c.id} className="border-t border-hairline">
                        <Td className="font-medium">{c.label}</Td>
                        <Td className="text-mute">
                          <code>{c.colKey}</code>
                        </Td>
                        <Td align="center">{c.dataType}</Td>
                        <Td align="center" className="text-mute">
                          {c.unit ?? "—"}
                        </Td>
                        <Td align="center">{c.isRequired ? "Yes" : "—"}</Td>
                        <Td className="text-mute">{c.options?.join(", ") ?? "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          )}

          {tab === "links" && (
            <Card className="overflow-hidden">
              <QueryBoundary isLoading={linksQ.isLoading} isError={linksQ.isError}>
                {links.length === 0 ? (
                  <EmptyState
                    icon="add_link"
                    title="Not linked to any KPI yet"
                    message="Linking records that this data source is the evidence behind a KPI or metric. It does not feed values into progress — that stays manual."
                    action={
                      isAdmin ? (
                        <Button icon="add_link" onClick={() => setShowLink(true)}>
                          Link KPI
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <LinksTable
                    dataSourceId={id}
                    links={links}
                    columns={columns}
                    cellLabels={cellLabels}
                    isAdmin={isAdmin}
                    onEdit={setEditingLink}
                  />
                )}
              </QueryBoundary>
            </Card>
          )}

          <ManageColumnsModal
            open={showColumns}
            onClose={() => setShowColumns(false)}
            dataSourceId={id}
            columns={columns}
          />

          <LinkKpiModal
            open={showLink || !!editingLink}
            onClose={() => {
              setShowLink(false);
              setEditingLink(null);
            }}
            dataSourceId={id}
            link={editingLink}
          />

          {(adding || editing) && (
            <EntryModal
              open
              onClose={() => {
                setAdding(false);
                setEditing(null);
              }}
              dataSourceId={id}
              periodGrain={source.periodGrain}
              columns={columns}
              entry={editing}
            />
          )}
        </>
      )}
    </QueryBoundary>
  );
}

function EntriesTable({
  columns,
  entries,
  canRecord,
  dataSourceId,
  actor,
  cellLabels,
  onEdit,
}: {
  columns: DataSourceColumn[];
  entries: DataSourceEntry[];
  canRecord: boolean;
  dataSourceId: number;
  actor: { actorId?: string; userRole?: string };
  cellLabels: Record<string, string>;
  onEdit: (entry: DataSourceEntry) => void;
}) {
  const confirm = useConfirm();
  const remove = useDeleteDataSourceEntry();

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <Th>Period</Th>
            {columns.map((c) => (
              <Th key={c.id} align={c.dataType === "number" ? "right" : "left"}>
                {c.label}
                {c.unit ? ` (${c.unit})` : ""}
              </Th>
            ))}
            <Th>Note</Th>
            <Th>Recorded by</Th>
            {canRecord && <Th align="right">Actions</Th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-hairline">
              <Td className="whitespace-nowrap font-medium">
                {formatEntryPeriod(e.year, e.quarter)}
              </Td>
              {columns.map((c) => (
                <Td key={c.id} align={c.dataType === "number" ? "right" : "left"}>
                  {formatCellValue(c, e.values[c.colKey] ?? null, cellLabels)}
                </Td>
              ))}
              <Td className="text-mute">{e.note ?? "—"}</Td>
              <Td className="text-mute">{e.recordedByName ?? "—"}</Td>
              {canRecord && (
                <Td align="right">
                  <div className="inline-flex items-center gap-xxs">
                    <button
                      type="button"
                      aria-label="Edit entry"
                      title="Edit entry"
                      onClick={() => onEdit(e)}
                      className="grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-on-surface"
                    >
                      <Icon name="edit" className="text-[18px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete entry"
                      title="Delete entry"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Delete this entry?",
                          message: `The ${formatEntryPeriod(e.year, e.quarter)} row will be permanently removed.`,
                          tone: "danger",
                          confirmLabel: "Delete",
                        });
                        if (ok) remove.mutate({ dataSourceId, entryId: e.id, actor });
                      }}
                      className="grid h-8 w-8 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-error"
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function LinksTable({
  dataSourceId,
  links,
  columns,
  cellLabels,
  isAdmin,
  onEdit,
}: {
  dataSourceId: number;
  links: DataSourceLink[];
  columns: DataSourceColumn[];
  cellLabels: Record<string, string>;
  isAdmin: boolean;
  onEdit: (link: DataSourceLink) => void;
}) {
  const confirm = useConfirm();
  const remove = useDeleteDataSourceLink();

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <Th>Strategic Set</Th>
            <Th>KPI</Th>
            <Th>Metric</Th>
            <Th>Feeds</Th>
            <Th>Note</Th>
            {isAdmin && <Th align="right">Actions</Th>}
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.id} className="border-t border-hairline">
              <Td className="text-mute">{l.setName ?? "—"}</Td>
              <Td className="font-medium">{l.kpiName ?? "—"}</Td>
              <Td>{l.metricName ?? "—"}</Td>
              <Td>
                {l.mappings.length === 0 ? (
                  <span className="text-caption-sm text-mute">evidence only</span>
                ) : (
                  <div className="flex flex-col gap-xxs">
                    {l.mappings.map((m, i) => (
                      <span key={i} className="text-caption-sm">
                        {m.slot !== "value" && (
                          <Badge tone="neutral">{m.slot}</Badge>
                        )}{" "}
                        {describeMapping(m, columns, cellLabels)}
                      </span>
                    ))}
                  </div>
                )}
              </Td>
              <Td className="text-mute">{l.note ?? "—"}</Td>
              {isAdmin && (
                <Td align="right">
                  <div className="inline-flex items-center gap-xxs">
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
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
