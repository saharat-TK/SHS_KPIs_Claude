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
  SearchInput,
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
  useDeleteDataSourceLink,
  useFacultyRecords,
  useAcademicCatalog,
} from "@/lib/data/hooks";
import {
  buildEntryTemplateCsv,
  formatCellValue,
  formatEntryPeriod,
  type TemplateChoice,
} from "@/lib/kpi/dataSources";
import { describeMapping } from "@/lib/kpi/dataSourceFilters";
import { buildCellLabels } from "@/lib/kpi/academicCatalog";
import { UTF8_BOM, downloadCsv, toCsv } from "@/lib/csv";
import { Icon } from "@/components/ui/Icon";
import type { DataSourceColumn, DataSourceEntry, DataSourceLink } from "@/lib/types";
import { EntryModal } from "./EntryModal";
import { ImportEntriesModal } from "./ImportEntriesModal";
import { LinkKpiModal } from "./LinkKpiModal";
import { ManageColumnsModal } from "./ManageColumnsModal";
import { EntriesTable, formatEntryCreatedAt } from "./EntriesTable";


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
  const [importing, setImporting] = useState(false);
  const [findData, setFindData] = useState("");

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
  const catalogQ = useAcademicCatalog();
  const cellLabels = useMemo(
    () => buildCellLabels(facultyQ.data ?? [], catalogQ.data),
    [facultyQ.data, catalogQ.data],
  );

  const fileSlug = source?.name.replace(/\s+/g, "-").toLowerCase() ?? "data-source";

  const exportCsv = () => {
    if (!source) return;
    const headers = ["Period", ...columns.map((c) => c.label), "Note", "Created at"];
    const rows = entries.map((e) => [
      formatEntryPeriod(e.year, e.quarter),
      ...columns.map((c) => formatCellValue(c, e.values[c.colKey] ?? null, cellLabels)),
      e.note ?? "",
      formatEntryCreatedAt(e.createdAt),
    ]);
    downloadCsv(`${fileSlug}.csv`, toCsv(headers, rows));
  };

  // A constrained column cannot be filled in offline unless the file says what
  // it accepts, so the template's legend enumerates every allowed value. The
  // codes come from the same two queries the entry form's pickers use, so the
  // template can never offer something the form would reject.
  const templateChoices = useMemo(() => {
    const catalog = catalogQ.data;
    const roster = (facultyQ.data ?? []).filter((f) => f.status === "active");
    const out: Record<string, TemplateChoice[]> = {};

    for (const c of columns) {
      if (c.dataType === "select") {
        out[c.colKey] = (c.options ?? []).map((o) => ({ code: o, label: o }));
      } else if (c.dataType === "program") {
        out[c.colKey] = (catalog?.programs ?? []).map((p) => ({
          code: p.code,
          label: p.label,
        }));
      } else if (c.dataType === "curriculum") {
        out[c.colKey] = (catalog?.curricula ?? []).map((x) => ({
          code: x.code,
          label: x.label,
          hint: x.programCode,
        }));
      } else if (c.dataType === "faculty") {
        // DERIVED_OPTION_SOURCE refuses to list 64 ids in an error message, but
        // someone filling a spreadsheet offline has no other way to find one.
        out[c.colKey] = roster.map((f) => ({
          code: f.id,
          label: f.name,
          hint: f.program,
        }));
      }
    }
    return out;
  }, [columns, catalogQ.data, facultyQ.data]);

  const downloadTemplate = () => {
    if (!source) return;
    // The BOM is what makes Excel read the Thai labels in the legend as UTF-8.
    const csv = buildEntryTemplateCsv({
      sourceName: source.name,
      grain: source.periodGrain,
      columns,
      choices: templateChoices,
    });
    downloadCsv(`${fileSlug}-template.csv`, `${UTF8_BOM}${csv}`);
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
              <div className="flex flex-wrap items-center gap-sm">
                {entries.length > 0 && (
                  <Button variant="ghost" icon="download" onClick={exportCsv}>
                    Export CSV
                  </Button>
                )}
                {tab === "data" && canRecord && columns.length > 0 && (
                  <>
                    <Button variant="ghost" icon="description" onClick={downloadTemplate}>
                      Template
                    </Button>
                    <Button
                      variant="ghost"
                      icon="upload_file"
                      onClick={() => setImporting(true)}
                    >
                      Upload CSV
                    </Button>
                    <Button icon="add" onClick={() => setAdding(true)}>
                      Add Entry
                    </Button>
                  </>
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

          <div className="mb-md flex flex-col gap-sm sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-wrap items-center gap-sm text-body-sm text-mute sm:flex-1 sm:flex-nowrap">
              <Badge className="shrink-0" tone={source.status === "active" ? "success" : "neutral"}>
                {source.status}
              </Badge>
              <span className="min-w-0 truncate">{source.committeeName ?? source.committeeId}</span>
              <span className="shrink-0">·</span>
              <span className="shrink-0">{source.periodGrain} entries</span>
            </div>
            {tab === "data" && columns.length > 0 && (
              <div className="w-full sm:ml-md sm:w-80 sm:shrink-0">
                <SearchInput
                  aria-label="Find data"
                  placeholder="Find data"
                  value={findData}
                  onChange={(event) => setFindData(event.target.value)}
                />
              </div>
            )}
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
            <Card className="overflow-visible">
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
                    query={findData}
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

          <ImportEntriesModal
            open={importing}
            onClose={() => setImporting(false)}
            dataSourceId={id}
            periodGrain={source.periodGrain}
            columns={columns}
            choices={templateChoices}
            entries={entries}
            cellLabels={cellLabels}
            onDownloadTemplate={downloadTemplate}
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
