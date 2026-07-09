"use client";

import { useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Button,
  Badge,
  Select,
  SearchInput,
  Field,
  Input,
  Modal,
  QueryBoundary,
  EmptyState,
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useMetrics,
  useKpis,
  useUpsertMetric,
  useDeleteMetric,
} from "@/lib/data/hooks";
import type { Metric } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export default function MetricsPage() {
  return (
    <RequirePermission action="configure_kpis">
      <MetricsManagement />
    </RequirePermission>
  );
}

type Editing = Metric | { isNew: true } | null;

function MetricsManagement() {
  const metrics = useMetrics();
  const kpis = useKpis();
  const upsert = useUpsertMetric();
  const del = useDeleteMetric();
  const confirm = useConfirm();

  const [kpiFilter, setKpiFilter] = useState("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Editing>(null);

  const kpiName = (id: string) => kpis.data?.find((k) => k.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    let list = metrics.data ?? [];
    if (kpiFilter !== "all") list = list.filter((m) => m.kpiId === kpiFilter);
    if (q.trim())
      list = list.filter((m) =>
        m.name.toLowerCase().includes(q.trim().toLowerCase()),
      );
    return list;
  }, [metrics.data, kpiFilter, q]);

  return (
    <>
      <PageHeader
        title="Metrics Management"
        description="Define measurable sub-KPIs, their targets, weights and data sources."
        actions={
          <Button icon="add" onClick={() => setEditing({ isNew: true })}>
            New Metric
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-md border-b border-hairline p-lg">
          <div className="min-w-[200px] flex-1">
            <SearchInput
              placeholder="Search metrics…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select
            value={kpiFilter}
            onChange={(e) => setKpiFilter(e.target.value)}
            className="w-auto min-w-[200px]"
          >
            <option value="all">All KPIs</option>
            {kpis.data?.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </Select>
        </div>

        <QueryBoundary isLoading={metrics.isLoading || kpis.isLoading} isError={metrics.isError}>
          {rows.length === 0 ? (
            <EmptyState
              title="No metrics found"
              message="Create a metric or adjust the filters."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Metric Name</Th>
                  <Th>Parent KPI</Th>
                  <Th align="center">Weight</Th>
                  <Th align="right">Current</Th>
                  <Th align="right">Target</Th>
                  <Th>Data Source</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <Tr key={m.id}>
                    <Td className="font-medium">{m.name}</Td>
                    <Td className="text-mute">{kpiName(m.kpiId)}</Td>
                    <Td align="center">
                      <Badge tone="neutral">{m.weight}%</Badge>
                    </Td>
                    <Td align="right">{formatNumber(m.currentValue, 1)} {m.unit}</Td>
                    <Td align="right" className="text-mute">{formatNumber(m.target, 1)} {m.unit}</Td>
                    <Td>
                      <Badge tone="info">{m.dataSource}</Badge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-xs">
                        <button
                          aria-label="Edit metric"
                          className="text-mute hover:text-on-surface p-xs rounded hover:bg-surface-soft"
                          onClick={() => setEditing(m)}
                        >
                          <Icon name="edit" size={18} />
                        </button>
                        <button
                          aria-label="Delete metric"
                          className="text-mute hover:text-error p-xs rounded hover:bg-surface-soft"
                          onClick={async () => {
                            if (
                              await confirm({
                                title: "Delete metric",
                                message: `Delete metric "${m.name}"? This can't be undone.`,
                                confirmLabel: "Delete",
                              })
                            ) {
                              del.mutate(m.id);
                            }
                          }}
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      {editing && (
        <MetricModal
          editing={editing}
          kpis={(kpis.data ?? []).map((k) => ({ id: k.id, name: k.name }))}
          submitting={upsert.isPending}
          onClose={() => setEditing(null)}
          onSave={(payload) =>
            upsert.mutate(payload, { onSuccess: () => setEditing(null) })
          }
        />
      )}
    </>
  );
}

function MetricModal({
  editing,
  kpis,
  onClose,
  onSave,
  submitting,
}: {
  editing: Editing;
  kpis: { id: string; name: string }[];
  onClose: () => void;
  onSave: (payload: Metric | Omit<Metric, "id">) => void;
  submitting: boolean;
}) {
  const existing = editing && "id" in editing ? editing : null;
  const [name, setName] = useState(existing?.name ?? "");
  const [kpiId, setKpiId] = useState(existing?.kpiId ?? kpis[0]?.id ?? "");
  const [weight, setWeight] = useState(existing?.weight ?? 50);
  const [currentValue, setCurrentValue] = useState(existing?.currentValue ?? 0);
  const [target, setTarget] = useState(existing?.target ?? 100);
  const [unit, setUnit] = useState(existing?.unit ?? "%");
  const [dataSource, setDataSource] = useState(existing?.dataSource ?? "");

  const valid = name.trim().length > 1 && kpiId;

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? "Edit Metric" : "New Metric"}
      subtitle="Sub-KPIs roll up into their parent KPI by weight."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() => {
              const base = {
                kpiId,
                name: name.trim(),
                weight,
                calculationMethod: existing?.calculationMethod ?? "Manual entry",
                currentValue,
                target,
                unit,
                dataSource: dataSource || "Manual",
                assignedCommitteeIds: existing?.assignedCommitteeIds ?? [],
              };
              onSave(existing ? { ...base, id: existing.id } : base);
            }}
          >
            {submitting ? "Saving…" : "Save Metric"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="Metric Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. First-Year Retention" />
        </Field>
        <Field label="Parent KPI">
          <Select value={kpiId} onChange={(e) => setKpiId(e.target.value)}>
            {kpis.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
          <Field label="Weight %">
            <Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
          </Field>
          <Field label="Current">
            <Input type="number" value={currentValue} onChange={(e) => setCurrentValue(Number(e.target.value))} />
          </Field>
          <Field label="Target">
            <Input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          </Field>
          <Field label="Unit">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </Field>
        </div>
        <Field label="Data Source">
          <Input value={dataSource} onChange={(e) => setDataSource(e.target.value)} placeholder="e.g. Registrar SIS" />
        </Field>
      </div>
    </Modal>
  );
}
