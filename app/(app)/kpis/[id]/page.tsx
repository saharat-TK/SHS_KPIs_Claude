"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Table,
  Th,
  Td,
  Tr,
  Button,
  Badge,
  Field,
  Input,
  Select,
  RadioGroup,
  StatusPill,
  QueryBoundary,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useKpi,
  useMetricsByKpi,
  useUpdateKpi,
  useCommittees,
  useFormulas,
  useKpiCategories,
} from "@/lib/data/hooks";
import {
  KPI_CATEGORIES,
  KPI_CALCULATION_TYPES,
  type Kpi,
  type KpiCalculationType,
} from "@/lib/types";
import { formatNumber, computeKpiValue } from "@/lib/utils";

export default function KpiDetailPage() {
  return (
    <RequirePermission action="configure_kpis">
      <KpiDetail />
    </RequirePermission>
  );
}

function KpiDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const kpiQ = useKpi(id);
  const metricsQ = useMetricsByKpi(id);
  const committees = useCommittees();
  const formulas = useFormulas();
  const categoriesQ = useKpiCategories();
  const update = useUpdateKpi();

  const categories = categoriesQ.data ?? KPI_CATEGORIES;

  const [draft, setDraft] = useState<Kpi | null>(null);
  useEffect(() => {
    if (kpiQ.data) setDraft(kpiQ.data);
  }, [kpiQ.data]);

  const dirty =
    !!draft && !!kpiQ.data && JSON.stringify(draft) !== JSON.stringify(kpiQ.data);

  const catLabel = (c: string) =>
    categories.find((x) => x.id === c)?.label ?? c;
  const committeeName = (d: string) =>
    committees.data?.find((x) => x.id === d)?.name ?? d;

  const set = (patch: Partial<Kpi>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  // Switching to an aggregate method derives the KPI value from its sub-KPIs so
  // the Threshold panel stays consistent; the write flows through normal Save.
  const setCalculationType = (calculationType: KpiCalculationType) =>
    setDraft((d) => {
      if (!d) return d;
      const derived = computeKpiValue(calculationType, metricsQ.data ?? []);
      return {
        ...d,
        calculationType,
        currentValue: derived ?? d.currentValue,
      };
    });
  const toggleCommittee = (committeeId: string) =>
    setDraft((d) => {
      if (!d) return d;
      const has = d.committeeIds.includes(committeeId);
      return {
        ...d,
        committeeIds: has
          ? d.committeeIds.filter((x) => x !== committeeId)
          : [...d.committeeIds, committeeId],
      };
    });

  return (
    <QueryBoundary isLoading={kpiQ.isLoading || !draft} isError={kpiQ.isError}>
      {draft && (
        <>
          <PageHeader
            title={draft.name}
            description={`${catLabel(draft.category)} · weight ${draft.weight}%`}
            actions={
              <>
                <Button variant="ghost" onClick={() => router.push("/kpis")}>
                  Back
                </Button>
                <Button
                  variant="outline"
                  disabled={!dirty}
                  onClick={() => kpiQ.data && setDraft(kpiQ.data)}
                >
                  Discard
                </Button>
                <Button
                  icon="save"
                  disabled={!dirty || update.isPending}
                  onClick={() =>
                    update.mutate({ id, patch: draft })
                  }
                >
                  {update.isPending ? "Saving…" : "Save Metadata"}
                </Button>
              </>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-lg">
            <div className="flex flex-col gap-lg min-w-0">
              <Card>
                <CardHeader
                  title="Core Configuration"
                  actions={<StatusPill status="active" />}
                />
                <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                  <Field label="KPI Name">
                    <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
                  </Field>
                  <Field label="Category">
                    <Select
                      value={draft.category}
                      onChange={(e) => set({ category: e.target.value as Kpi["category"] })}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Weight (%)" hint="Relative weight within category">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.weight}
                      onChange={(e) => set({ weight: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Unit">
                    <Input value={draft.unit} onChange={(e) => set({ unit: e.target.value })} />
                  </Field>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="KPI Calculation Logic"
                  subtitle={
                    KPI_CALCULATION_TYPES.find((t) => t.id === draft.calculationType)
                      ?.label
                  }
                  actions={
                    draft.calculationType === "custom_formula" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconRight="open_in_new"
                        onClick={() => router.push("/formulas/builder")}
                      >
                        Open in builder
                      </Button>
                    )
                  }
                />
                <CardBody className="flex flex-col gap-lg">
                  <RadioGroup
                    name="calculationType"
                    value={draft.calculationType}
                    options={KPI_CALCULATION_TYPES.map((t) => ({
                      value: t.id,
                      label: t.label,
                      hint: t.hint,
                    }))}
                    onChange={setCalculationType}
                  />
                  {draft.calculationType === "custom_formula" ? (
                    draft.formulaId ? (
                      <FormulaSummary
                        formula={formulas.data?.find(
                          (f) => String(f.id) === draft.formulaId,
                        )}
                      />
                    ) : (
                      <p className="text-body-sm text-mute">
                        No formula linked yet — open the builder to create or link one.
                      </p>
                    )
                  ) : (
                    <AggregateSummary
                      unit={draft.unit}
                      count={(metricsQ.data ?? []).length}
                      value={computeKpiValue(
                        draft.calculationType,
                        metricsQ.data ?? []
                      )}
                    />
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Sub-KPIs Structure"
                  subtitle="Component metrics that roll up into this KPI"
                  actions={
                    <Button
                      variant="outline"
                      size="sm"
                      icon="add"
                      onClick={() => router.push("/metrics")}
                    >
                      Manage
                    </Button>
                  }
                />
                <QueryBoundary isLoading={metricsQ.isLoading} isError={metricsQ.isError}>
                  {(metricsQ.data ?? []).length === 0 ? (
                    <CardBody>
                      <p className="text-body-sm text-mute">No sub-KPIs defined.</p>
                    </CardBody>
                  ) : (
                    <Table>
                      <thead>
                        <tr>
                          <Th>Metric Name</Th>
                          <Th align="center">Weight</Th>
                          <Th align="right">Current</Th>
                          <Th align="right">Target</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricsQ.data!.map((m) => (
                          <Tr key={m.id}>
                            <Td className="font-medium">{m.name}</Td>
                            <Td align="center">
                              <Badge tone="neutral">{m.weight}%</Badge>
                            </Td>
                            <Td align="right">{formatNumber(m.currentValue, 1)} {m.unit}</Td>
                            <Td align="right" className="text-mute">{formatNumber(m.target, 1)} {m.unit}</Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </QueryBoundary>
              </Card>
            </div>

            <div className="flex flex-col gap-lg">
              <Card>
                <CardHeader title="Threshold Settings" />
                <CardBody className="flex flex-col gap-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-mute">Current value</span>
                    <span className="text-heading-md text-on-surface">
                      {formatNumber(draft.currentValue, 1)} {draft.unit}
                    </span>
                  </div>
                  <ThresholdBar value={draft.currentValue} thresholds={draft.thresholds} />
                  <p className="text-caption-sm text-mute">
                    {HEALTH_LABEL[healthOf(draft.currentValue, draft.thresholds)]}
                  </p>
                  <Field label="On-target threshold (≥)">
                    <Input
                      type="number"
                      value={draft.thresholds.green}
                      onChange={(e) =>
                        set({ thresholds: { ...draft.thresholds, green: Number(e.target.value) } })
                      }
                    />
                  </Field>
                  <Field label="Watch threshold (≥)">
                    <Input
                      type="number"
                      value={draft.thresholds.amber}
                      onChange={(e) =>
                        set({ thresholds: { ...draft.thresholds, amber: Number(e.target.value) } })
                      }
                    />
                  </Field>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Committee Mapping"
                  subtitle={`${draft.committeeIds.length} of ${committees.data?.length ?? 0} tracked`}
                />
                <CardBody className="flex flex-col gap-xs max-h-[320px] overflow-y-auto scroll-thin">
                  {committees.data?.map((d) => {
                    const on = draft.committeeIds.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleCommittee(d.id)}
                        className="flex items-center justify-between gap-sm rounded-DEFAULT px-md py-sm hover:bg-surface-soft transition-colors text-left"
                      >
                        <span className="text-body-sm">{committeeName(d.id)}</span>
                        <Icon
                          name={on ? "check_box" : "check_box_outline_blank"}
                          size={20}
                          className={on ? "text-primary-container" : "text-stone"}
                        />
                      </button>
                    );
                  })}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </QueryBoundary>
  );
}

function AggregateSummary({
  value,
  count,
  unit,
}: {
  value: number | null;
  count: number;
  unit: string;
}) {
  if (count === 0) {
    return (
      <p className="text-body-sm text-mute">
        No sub-KPIs to aggregate — add component metrics below to derive a value.
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-soft border border-hairline px-md py-sm">
      <span className="text-body-sm text-mute">
        Derived from {count} sub-KPI{count === 1 ? "" : "s"}
      </span>
      <span className="text-heading-sm text-on-surface">
        {value === null ? "—" : `${formatNumber(value, 1)} ${unit}`}
      </span>
    </div>
  );
}

function FormulaSummary({
  formula,
}: {
  formula?: {
    name: string;
    expression: string;
    currentVersion: string | null;
    variables?: { symbol: string; label: string }[];
  };
}) {
  if (!formula) return <p className="text-body-sm text-mute">Formula not found.</p>;
  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center gap-sm">
        {formula.currentVersion && <Badge tone="primary">{formula.currentVersion}</Badge>}
        <span className="text-body-strong">{formula.name}</span>
      </div>
      <code className="block rounded-lg bg-surface-soft border border-hairline px-md py-sm font-mono text-body-sm text-on-surface">
        {formula.expression}
      </code>
      <div className="flex flex-wrap gap-xs">
        {(formula.variables ?? []).map((v) => (
          <Badge key={v.symbol} tone="neutral">
            <span className="font-mono">{v.symbol}</span> = {v.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
