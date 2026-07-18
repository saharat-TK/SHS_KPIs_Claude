"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Button,
  Badge,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCommittees, useCreateDataSource, useDataSources } from "@/lib/data/hooks";
import type { Committee, DataSource, DataSourcePeriodGrain } from "@/lib/types";

export default function DataSourcesPage() {
  return (
    <RequirePermission action="view_dashboards">
      <DataSources />
    </RequirePermission>
  );
}

function DataSources() {
  const router = useRouter();
  const { can, user } = useAuth();
  const [committeeFilter, setCommitteeFilter] = useState("");
  const sourcesQ = useDataSources(
    committeeFilter ? { committeeId: committeeFilter } : undefined,
  );
  const committeesQ = useCommittees();
  const create = useCreateDataSource();
  const [showCreate, setShowCreate] = useState(false);

  const sources = sourcesQ.data ?? [];
  const isAdmin = can("configure_kpis");

  // A committee member's own sources are what they came here for, so float them
  // to the top rather than making them hunt through every committee's list.
  const ordered = user?.committeeId
    ? [...sources].sort((a, b) => {
        const mine = (s: DataSource) => (s.committeeId === user.committeeId ? 0 : 1);
        return mine(a) - mine(b) || a.name.localeCompare(b.name);
      })
    : sources;

  const newButton = isAdmin ? (
    <Button icon="add" onClick={() => setShowCreate(true)}>
      New Data Source
    </Button>
  ) : undefined;

  return (
    <>
      <PageHeader
        title="Data Sources"
        description="Committee-owned raw data behind the KPI numbers. Each source defines its own columns; committees record rows against them."
        actions={newButton}
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-sm border-b border-hairline p-md">
          <Select
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            className="max-w-xs"
            aria-label="Filter by committee"
          >
            <option value="">All committees</option>
            {(committeesQ.data ?? []).map((c: Committee) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <QueryBoundary isLoading={sourcesQ.isLoading} isError={sourcesQ.isError}>
          {ordered.length === 0 ? (
            <EmptyState
              icon="database"
              title="No data sources yet"
              message={
                isAdmin
                  ? "Create a data source, define its columns, then let its committee record raw data against them."
                  : "No data source has been set up for this filter yet. An administrator creates them."
              }
              action={newButton}
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Committee</Th>
                  <Th align="center">Grain</Th>
                  <Th align="center">Columns</Th>
                  <Th align="center">Entries</Th>
                  <Th align="center">Linked KPIs</Th>
                  <Th align="center">Status</Th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((s) => (
                  <Tr
                    key={s.id}
                    onClick={() => router.push(`/kpi-management/data-sources/${s.id}`)}
                  >
                    <Td className="font-medium">{s.name}</Td>
                    <Td className="text-mute">{s.committeeName ?? s.committeeId}</Td>
                    <Td align="center">{s.periodGrain}</Td>
                    <Td align="center">
                      {s.columnCount ?? 0 ? (
                        s.columnCount
                      ) : (
                        <Badge tone="warning">none yet</Badge>
                      )}
                    </Td>
                    <Td align="center">{s.entryCount ?? 0}</Td>
                    <Td align="center">{s.linkCount ?? 0}</Td>
                    <Td align="center">
                      <Badge tone={s.status === "active" ? "success" : "neutral"}>
                        {s.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      <CreateDataSourceModal
        open={showCreate}
        committees={committeesQ.data ?? []}
        submitting={create.isPending}
        onClose={() => setShowCreate(false)}
        onCreate={(input) =>
          create.mutate(
            { ...input, createdBy: user?.facultyId },
            {
              onSuccess: (created) => {
                setShowCreate(false);
                router.push(`/kpi-management/data-sources/${created.id}`);
              },
            },
          )
        }
      />
    </>
  );
}

function CreateDataSourceModal({
  open,
  committees,
  submitting,
  onClose,
  onCreate,
}: {
  open: boolean;
  committees: Committee[];
  submitting: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    description?: string;
    committeeId: string;
    periodGrain: DataSourcePeriodGrain;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [periodGrain, setPeriodGrain] = useState<DataSourcePeriodGrain>("quarterly");

  const valid = name.trim().length > 0 && committeeId.length > 0;

  const reset = () => {
    setName("");
    setDescription("");
    setCommitteeId("");
    setPeriodGrain("quarterly");
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="New Data Source"
      subtitle="The owning committee records data here; you define which columns it collects on the next screen."
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() =>
              onCreate({
                name: name.trim(),
                description: description.trim() || undefined,
                committeeId,
                periodGrain,
              })
            }
          >
            {submitting ? "Creating…" : "Create"}
          </Button>
        </>
      }
    >
      <div className="grid gap-md">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Graduate employment survey"
          />
        </Field>
        <Field label="Description" hint="Optional — what this data is and where it comes from.">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Owning committee" hint="Only this committee's members can record entries.">
          <Select value={committeeId} onChange={(e) => setCommitteeId(e.target.value)}>
            <option value="">Select a committee…</option>
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Period grain"
          hint="Quarterly entries carry a year and quarter; annual entries carry only a year. This cannot be changed once data is recorded."
        >
          <Select
            value={periodGrain}
            onChange={(e) => setPeriodGrain(e.target.value as DataSourcePeriodGrain)}
          >
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
