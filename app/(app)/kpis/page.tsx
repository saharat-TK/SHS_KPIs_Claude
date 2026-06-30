"use client";

import { useMemo, useState } from "react";
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
  Tabs,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  Select,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useKpis, useMetrics, useCreateKpi } from "@/lib/data/hooks";
import { KPI_CATEGORIES, type KpiCategory } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export default function KpisPage() {
  return (
    <RequirePermission action="configure_kpis">
      <KpiManagement />
    </RequirePermission>
  );
}

function KpiManagement() {
  const router = useRouter();
  const kpis = useKpis();
  const metrics = useMetrics();
  const create = useCreateKpi();
  const [cat, setCat] = useState<KpiCategory>("student_success");
  const [showCreate, setShowCreate] = useState(false);

  const tabs = KPI_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    count: (kpis.data ?? []).filter((k) => k.category === c.id).length,
  }));

  const rows = useMemo(
    () => (kpis.data ?? []).filter((k) => k.category === cat),
    [kpis.data, cat],
  );

  const subCount = (kpiId: string) =>
    (metrics.data ?? []).filter((m) => m.kpiId === kpiId).length;

  return (
    <>
      <PageHeader
        title="KPI Management"
        description="Configure key performance indicators, their sub-KPIs, weights and thresholds."
        actions={
          <Button icon="add" onClick={() => setShowCreate(true)}>
            Create New KPI
          </Button>
        }
      />

      <Tabs
        items={tabs}
        active={cat}
        onChange={(id) => setCat(id as KpiCategory)}
      />

      <Card className="overflow-hidden">
        <QueryBoundary isLoading={kpis.isLoading} isError={kpis.isError}>
          {rows.length === 0 ? (
            <EmptyState
              title="No KPIs in this category"
              message="Create one to start tracking this category."
              action={
                <Button icon="add" onClick={() => setShowCreate(true)}>
                  Create New KPI
                </Button>
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Metric Name</Th>
                  <Th align="center">Weight</Th>
                  <Th align="center">Sub-KPIs</Th>
                  <Th align="right">Current Value</Th>
                  <Th>Health</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => {
                  const health = healthOf(k.currentValue, k.thresholds);
                  return (
                    <Tr key={k.id} onClick={() => router.push(`/kpis/${k.id}`)}>
                      <Td className="font-medium">{k.name}</Td>
                      <Td align="center">
                        <Badge tone="neutral">{k.weight}%</Badge>
                      </Td>
                      <Td align="center">{subCount(k.id)}</Td>
                      <Td align="right" className="font-medium">
                        {formatNumber(k.currentValue, 1)}
                        <span className="text-mute"> {k.unit}</span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-sm">
                          <ThresholdBar
                            value={k.currentValue}
                            thresholds={k.thresholds}
                            className="w-[90px]"
                          />
                          <span className="text-caption-sm text-mute">
                            {HEALTH_LABEL[health]}
                          </span>
                        </div>
                      </Td>
                      <Td align="right">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconRight="chevron_right"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/kpis/${k.id}`);
                          }}
                        >
                          Configure
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      <CreateKpiModal
        open={showCreate}
        defaultCategory={cat}
        submitting={create.isPending}
        onClose={() => setShowCreate(false)}
        onCreate={(input) =>
          create.mutate(input, {
            onSuccess: (k) => {
              setShowCreate(false);
              router.push(`/kpis/${k.id}`);
            },
          })
        }
      />
    </>
  );
}

function CreateKpiModal({
  open,
  onClose,
  onCreate,
  defaultCategory,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: Parameters<ReturnType<typeof useCreateKpi>["mutate"]>[0]) => void;
  defaultCategory: KpiCategory;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<KpiCategory>(defaultCategory);
  const [weight, setWeight] = useState(25);
  const [unit, setUnit] = useState("%");
  const valid = name.trim().length > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New KPI"
      subtitle="Define the indicator; configure sub-KPIs and thresholds next."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() =>
              onCreate({
                name: name.trim(),
                category,
                weight,
                unit,
                calculationMethod: "Manual entry",
                currentValue: 0,
                thresholds: { green: 80, amber: 60 },
                departmentIds: [],
              })
            }
          >
            {submitting ? "Creating…" : "Create KPI"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="KPI Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Clinical Placement Rate" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as KpiCategory)}>
              {KPI_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Weight (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </Field>
          <Field label="Unit">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
