"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Field,
  Input,
  Select,
  UnitSelect,
  RadioGroup,
  ThresholdBar,
  QueryBoundary,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import {
  useLibraryKpi,
  useStrategicSet,
  useKpiCategories,
  useCommittees,
  useCommitteeMemberships,
  useFacultyRecords,
  useFormulas,
  useUpdateLibraryKpi,
  useSaveLibraryKpiTargets,
  useLibraryMetrics,
} from "@/lib/data/hooks";
import {
  KPI_CALCULATION_TYPES,
  KPI_TYPES,
  COLLECTION_PERIODS,
  type KpiCalculationType,
  type KpiType,
  type CollectionPeriod,
  type LibraryKpi,
  type LibraryMetric,
  type FormulaRecord,
  type AnnualTarget,
  type QuarterlyTargetMode,
} from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { unitNeedsDivisor } from "@/lib/kpi/progress";
import { personsForCommittee } from "@/lib/kpi/committee";
import { MetricEditor } from "./MetricEditor";

// The pooled calculation types: aggregated from live progress on performance
// records, so the library (targets only) can't preview them. Presence in this
// map is what marks a type as pooled — add an entry to introduce another.
const POOLED_EXPLAINER: Partial<Record<KpiCalculationType, string>> = {
  percent_of_total:
    "Computed on performance records as total sub-KPI progress ÷ total sub-KPI target × 100 for the quarter.",
  ratio_of_total:
    "Computed on performance records as total sub-KPI progress ÷ total sub-KPI target for the quarter.",
  combined_percent:
    "Computed on performance records as total sub-KPI numerator ÷ total sub-KPI denominator × 100 for the quarter. Use this when the sub-KPIs are themselves percentages.",
  combined_ratio:
    "Computed on performance records as total sub-KPI numerator ÷ total sub-KPI denominator for the quarter. Use this when the sub-KPIs are themselves ratios.",
};

// Units that imply a calculation type. Drives the soft default in setUnit.
const DEFAULT_CALC_FOR_UNIT: Record<string, KpiCalculationType> = {
  percent: "percent_of_total",
  ratio: "ratio_of_total",
};

// Normalise the sparse annual-target rows into a fixed 5-slot array.
function toYearSlots(targets: AnnualTarget[] | undefined): (number | null)[] {
  const slots: (number | null)[] = [null, null, null, null, null];
  (targets ?? []).forEach((t) => {
    if (t.yearNo >= 1 && t.yearNo <= 5) slots[t.yearNo - 1] = t.targetValue;
  });
  return slots;
}

export default function KpiDetailPage() {
  return (
    <RequirePermission action="configure_kpis">
      <KpiDetail />
    </RequirePermission>
  );
}

type Draft = {
  name: string;
  description: string;
  categoryId: string;
  kpiType: KpiType;
  dataCollectMethod: string;
  collectionPeriod: CollectionPeriod;
  dataSourceUrl: string;
  committeeId: string;
  personInChargeId: string;
  weight: number;
  unit: string;
  fiveYearTarget: number | null;
  calculationType: KpiCalculationType;
  calculationLogic: string;
  formulaId: number | null;
  quarterlyTargetMode: QuarterlyTargetMode;
  variable1Name: string;
  variable1Unit: string;
  variable2Name: string;
  variable2Unit: string;
  thresholdGreen: number | null;
  thresholdAmber: number | null;
};

function draftOf(k: LibraryKpi): Draft {
  return {
    name: k.name,
    description: k.description ?? "",
    categoryId: k.categoryId ?? "",
    kpiType: k.kpiType,
    dataCollectMethod: k.dataCollectMethod ?? "",
    collectionPeriod: k.collectionPeriod,
    dataSourceUrl: k.dataSourceUrl ?? "",
    committeeId: k.committeeId ?? "",
    personInChargeId: k.personInChargeId ?? "",
    weight: k.weight,
    unit: k.unit?.trim() || "Item",
    fiveYearTarget: k.fiveYearTarget,
    calculationType: k.calculationType,
    calculationLogic: k.calculationLogic ?? "",
    formulaId: k.formulaId,
    quarterlyTargetMode: k.quarterlyTargetMode,
    variable1Name: k.variable1Name ?? "",
    variable1Unit: k.variable1Unit?.trim() || "Item",
    variable2Name: k.variable2Name ?? "",
    variable2Unit: k.variable2Unit?.trim() || "Item",
    thresholdGreen: k.thresholdGreen,
    thresholdAmber: k.thresholdAmber,
  };
}

function KpiDetail() {
  const router = useRouter();
  const params = useParams<{ setId: string; kpiId: string }>();
  const setId = Number(params.setId);
  const kpiId = Number(params.kpiId);

  const kpiQ = useLibraryKpi(kpiId);
  const setQ = useStrategicSet(setId);
  const categoriesQ = useKpiCategories(setId);

  // Keep the set name (parent crumb) and KPI name in the breadcrumb; relabel the
  // intermediate "kpis" crumb to "KPIs" (the static map reads it as "KPI Management").
  useBreadcrumbLabel(`/kpi-management/library/${setId}`, setQ.data?.name);
  useBreadcrumbLabel(`/kpi-management/library/${setId}/kpis`, "KPIs");
  useBreadcrumbLabel(`/kpi-management/library/${setId}/kpis/${kpiId}`, kpiQ.data?.name);
  const committeesQ = useCommittees();
  const membershipsQ = useCommitteeMemberships();
  const facultyQ = useFacultyRecords();
  const formulasQ = useFormulas();
  const metricsQ = useLibraryMetrics(kpiId);
  const update = useUpdateLibraryKpi();
  const saveTargets = useSaveLibraryKpiTargets();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [years, setYears] = useState<(number | null)[]>([null, null, null, null, null]);

  // Sync local draft when the KPI (re)loads.
  useEffect(() => {
    if (kpiQ.data) {
      setDraft(draftOf(kpiQ.data));
      setYears(toYearSlots(kpiQ.data.annualTargets));
    }
  }, [kpiQ.data]);

  const original = kpiQ.data ? draftOf(kpiQ.data) : null;
  const originalYears = kpiQ.data ? toYearSlots(kpiQ.data.annualTargets) : [];

  const dirty =
    !!draft &&
    (JSON.stringify(draft) !== JSON.stringify(original) ||
      JSON.stringify(years) !== JSON.stringify(originalYears));

  // Per-year cap (decision #5) - mirrored client-side.
  const cap = draft?.fiveYearTarget ?? null;
  const overCapYear =
    cap == null
      ? null
      : years
          .map((targetValue, index) => ({ yearNo: index + 1, targetValue }))
          .find(({ targetValue }) => targetValue != null && targetValue > cap);
  const capError =
    cap != null && overCapYear?.targetValue != null
      ? `Year ${overCapYear.yearNo} target (${overCapYear.targetValue.toFixed(2)}) must not exceed the 5-year target (${cap.toFixed(2)}).`
      : null;

  // KPI variables (decision: Variable 1 required always; Variable 2 required
  // only when the unit is Percent/Ratio).
  const needsDivisor = draft ? unitNeedsDivisor(draft.unit) : false;
  const varError =
    draft == null
      ? null
      : !draft.variable1Name.trim()
        ? "Variable 1 (Dividend) name is required."
        : needsDivisor && !draft.variable2Name.trim()
          ? "Variable 2 (Divisor) name is required when the unit is Percent or Ratio."
          : null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  // Percent/Ratio KPIs almost always want the matching pooled type, so picking
  // that unit pre-selects it. A soft default: it bumps only when the incoming
  // unit implies a *different* type than the outgoing one — so re-picking the
  // same unit never undoes a deliberate override — and it never displaces a
  // deliberately linked custom formula.
  const setUnit = (value: string) =>
    setDraft((d) => {
      if (!d) return d;
      const next = DEFAULT_CALC_FOR_UNIT[value.trim().toLowerCase()];
      const prev = DEFAULT_CALC_FOR_UNIT[d.unit.trim().toLowerCase()];
      const bumpCalc = next != null && next !== prev && d.calculationType !== "custom_formula";
      return {
        ...d,
        unit: value,
        calculationType: bumpCalc ? next : d.calculationType,
      };
    });

  const save = () => {
    if (!draft || capError || varError) return;
    update.mutate(
      {
        id: kpiId,
        patch: {
          name: draft.name.trim(),
          description: draft.description,
          categoryId: draft.categoryId || null,
          kpiType: draft.kpiType,
          dataCollectMethod: draft.dataCollectMethod,
          collectionPeriod: draft.collectionPeriod,
          dataSourceUrl: draft.dataSourceUrl,
          committeeId: draft.committeeId || null,
          personInChargeId: draft.personInChargeId || null,
          weight: draft.weight,
          unit: draft.unit,
          fiveYearTarget: draft.fiveYearTarget,
          calculationType: draft.calculationType,
          calculationLogic: draft.calculationLogic,
          formulaId: draft.calculationType === "custom_formula" ? draft.formulaId : null,
          quarterlyTargetMode: draft.quarterlyTargetMode,
          variable1Name: draft.variable1Name,
          variable1Unit: draft.variable1Unit,
          variable2Name: needsDivisor ? draft.variable2Name : null,
          variable2Unit: needsDivisor ? draft.variable2Unit : null,
          thresholdGreen: draft.thresholdGreen,
          thresholdAmber: draft.thresholdAmber,
        },
      },
      {
        onSuccess: () =>
          saveTargets.mutate({
            id: kpiId,
            targets: years.map((v, i) => ({ yearNo: i + 1, targetValue: v })),
          }),
      },
    );
  };

  const categories = categoriesQ.data ?? [];
  const committees = committeesQ.data ?? [];
  const memberships = membershipsQ.data ?? [];
  const faculty = facultyQ.data ?? [];
  const formulas = formulasQ.data ?? [];
  const metrics = metricsQ.data ?? [];
  const hasChildren = metrics.length > 0;
  const parentTargets = useMemo(
    () => ({ fiveYearTarget: draft?.fiveYearTarget ?? null, years }),
    [draft?.fiveYearTarget, years],
  );
  const parentDefaults = useMemo(
    () => ({
      categoryId: kpiQ.data?.categoryId ?? "",
      collectionPeriod: kpiQ.data?.collectionPeriod ?? "every_quarter",
      committeeId: kpiQ.data?.committeeId ?? "",
      dataCollectMethod: kpiQ.data?.dataCollectMethod ?? "",
      dataSourceUrl: kpiQ.data?.dataSourceUrl ?? "",
    }),
    [
      kpiQ.data?.categoryId,
      kpiQ.data?.collectionPeriod,
      kpiQ.data?.committeeId,
      kpiQ.data?.dataCollectMethod,
      kpiQ.data?.dataSourceUrl,
    ],
  );
  const canAddMetric = !dirty && !update.isPending && !saveTargets.isPending;

  return (
    <>
      <PageHeader
        title={kpiQ.data?.name ?? "KPI"}
        description="Configure this KPI's core details, 5-year targets, calculation logic and sub-KPIs."
        actions={
          <>
            <Button
              variant="ghost"
              icon="arrow_back"
              onClick={() => router.push(`/kpi-management/library/${setId}`)}
            >
              Back to Set
            </Button>
            <Button
              icon="save"
              disabled={!dirty || !!capError || !!varError || update.isPending || saveTargets.isPending}
              onClick={save}
            >
              {update.isPending || saveTargets.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </>
        }
      />

      <QueryBoundary isLoading={kpiQ.isLoading} isError={kpiQ.isError}>
        {draft && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-lg">
            <div className="flex flex-col gap-lg">
              {/* Core Configuration */}
              <Card>
                <CardHeader title="Core Configuration" />
                <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                  <Field label="Name">
                    <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
                  </Field>
                  <Field label="Category">
                    <Select
                      value={draft.categoryId}
                      onChange={(e) => set("categoryId", e.target.value)}
                    >
                      <option value="">Uncategorised</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="KPI Type">
                    <Select
                      value={draft.kpiType}
                      onChange={(e) => set("kpiType", e.target.value as KpiType)}
                    >
                      {KPI_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Collection Period">
                    <Select
                      value={draft.collectionPeriod}
                      onChange={(e) =>
                        set("collectionPeriod", e.target.value as CollectionPeriod)
                      }
                    >
                      {COLLECTION_PERIODS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Data Collecting Method">
                    <Input
                      value={draft.dataCollectMethod}
                      onChange={(e) => set("dataCollectMethod", e.target.value)}
                      placeholder="e.g. Survey, registry export"
                    />
                  </Field>
                  <Field label="Data Source (URL)">
                    <Input
                      value={draft.dataSourceUrl}
                      onChange={(e) => set("dataSourceUrl", e.target.value)}
                      placeholder="https://…"
                    />
                  </Field>
                  <Field label="Committee in Charge">
                    <Select
                      value={draft.committeeId}
                      onChange={(e) => set("committeeId", e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {committees.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="Person in Charge"
                    hint={
                      !draft.committeeId
                        ? "Select a committee in charge first to choose a person."
                        : undefined
                    }
                  >
                    <Select
                      value={draft.personInChargeId}
                      disabled={!draft.committeeId}
                      onChange={(e) => set("personInChargeId", e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {personsForCommittee(
                        faculty,
                        memberships,
                        draft.committeeId,
                        draft.personInChargeId,
                      ).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.inCommittee ? "" : " — not in committee"}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Description">
                      <Input
                        value={draft.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="What this KPI measures"
                      />
                    </Field>
                  </div>
                </CardBody>
              </Card>

              {/* Annual Target (5 years) */}
              <Card>
                <CardHeader
                  title="Annual Target (5 years)"
                  subtitle="Each year target must not exceed the 5-year target."
                />
                <CardBody className="flex flex-col gap-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
                    <Field label="Weight (%)">
                      <Input
                        type="number"
                        value={draft.weight}
                        onChange={(e) => set("weight", Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Unit">
                      <UnitSelect value={draft.unit} onChange={setUnit} />
                    </Field>
                    <Field label="5-Year Target (cap)">
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.fiveYearTarget ?? ""}
                        onChange={(e) =>
                          set(
                            "fiveYearTarget",
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-md">
                    {years.map((v, i) => (
                      <Field key={i} label={`Year ${i + 1}`}>
                        <Input
                          type="number"
                          step="0.01"
                          value={v ?? ""}
                          onChange={(e) => {
                            const next = [...years];
                            next[i] = e.target.value === "" ? null : Number(e.target.value);
                            setYears(next);
                          }}
                        />
                      </Field>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-caption-sm">
                    <span className="text-mute">
                      Each year target must not exceed the 5-year target
                      {cap != null && <> ({cap.toFixed(2)})</>}.
                    </span>
                    {capError && <span className="text-error">{capError}</span>}
                  </div>
                </CardBody>
              </Card>

              {/* KPI Calculation Logic */}
              <Card>
                <CardHeader
                  title="KPI Calculation Logic"
                  subtitle={
                    KPI_CALCULATION_TYPES.find((t) => t.id === draft.calculationType)?.label
                  }
                  actions={
                    draft.calculationType === "custom_formula" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconRight="open_in_new"
                        onClick={() =>
                          router.push(
                            draft.formulaId
                              ? `/formulas/builder?formula=${draft.formulaId}`
                              : "/formulas/builder",
                          )
                        }
                      >
                        Open in builder
                      </Button>
                    ) : undefined
                  }
                />
                <CardBody className="flex flex-col gap-lg">
                  <RadioGroup
                    name="calcType"
                    value={draft.calculationType}
                    onChange={(v) => set("calculationType", v)}
                    orientation="horizontal"
                    options={KPI_CALCULATION_TYPES.map((t) => ({
                      value: t.id,
                      label: t.label,
                      hint: t.hint,
                    }))}
                  />
                  {draft.calculationType === "custom_formula" ? (
                    <>
                      <Field label="Linked formula">
                        <Select
                          value={draft.formulaId ?? ""}
                          onChange={(e) =>
                            set(
                              "formulaId",
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                        >
                          <option value="">— Select a formula —</option>
                          {formulas.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} {f.currentVersion ? `(${f.currentVersion})` : ""}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      {draft.formulaId ? (
                        <FormulaSummary
                          formula={formulas.find((f) => f.id === draft.formulaId)}
                        />
                      ) : (
                        <p className="text-body-sm text-mute">
                          No formula linked yet — pick one above or open the builder to create one.
                        </p>
                      )}
                    </>
                  ) : POOLED_EXPLAINER[draft.calculationType] ? (
                    <p className="text-body-sm text-mute">
                      {POOLED_EXPLAINER[draft.calculationType]} No preview here — the
                      library holds targets only.
                    </p>
                  ) : (
                    <AggregateSummary
                      unit={draft.unit}
                      count={metrics.length}
                      value={computeTargetPreview(draft.calculationType, metrics)}
                    />
                  )}

                  <div className="flex flex-col gap-sm border-t border-hairline pt-lg">
                    <div>
                      <span className="text-label-md text-on-surface">Quarterly Target</span>
                      <p className="text-caption-sm text-mute mt-tiny">
                        How each quarter&apos;s target is derived on performance records — applies to
                        this KPI and its sub-KPIs.
                      </p>
                    </div>
                    <RadioGroup
                      name="quarterlyTargetMode"
                      value={draft.quarterlyTargetMode}
                      onChange={(v) => set("quarterlyTargetMode", v as QuarterlyTargetMode)}
                      orientation="horizontal"
                      options={[
                        {
                          value: "divide_equally",
                          label: "Divide annual target into quarters (25% each)",
                          hint: "Cumulative — Q1 25%, Q2 50%, Q3 75%, Q4 100% of the annual target.",
                        },
                        {
                          value: "use_annual",
                          label: "Use annual target as each quarter's target",
                          hint: "Every quarter is measured against the full annual target.",
                        },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-md border-t border-hairline pt-lg">
                    <div>
                      <span className="text-label-md text-on-surface">KPI variables</span>
                      <p className="text-caption-sm text-mute mt-tiny">
                        Data entered per quarter on performance records (for KPIs without sub-KPIs).
                        Value = Variable 1
                        {needsDivisor
                          ? draft.unit.trim().toLowerCase() === "percent"
                            ? " ÷ Variable 2 × 100"
                            : " ÷ Variable 2"
                          : ""}
                        .
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-md">
                      <Field label="Variable 1 (Dividend) — name">
                        <Input
                          value={draft.variable1Name}
                          onChange={(e) => set("variable1Name", e.target.value)}
                          placeholder="e.g. Graduates employed"
                        />
                      </Field>
                      <Field label="Unit">
                        <UnitSelect
                          value={draft.variable1Unit}
                          onChange={(value) => set("variable1Unit", value)}
                        />
                      </Field>
                      <Field label="Variable 2 (Divisor) — name">
                        <Input
                          value={needsDivisor ? draft.variable2Name : ""}
                          disabled={!needsDivisor}
                          onChange={(e) => set("variable2Name", e.target.value)}
                          placeholder={
                            needsDivisor ? "e.g. Total graduates" : "Enabled for Percent / Ratio units"
                          }
                        />
                      </Field>
                      <Field label="Unit">
                        <UnitSelect
                          value={needsDivisor ? draft.variable2Unit : "Item"}
                          disabled={!needsDivisor}
                          onChange={(value) => set("variable2Unit", value)}
                        />
                      </Field>
                    </div>
                    {varError && <span className="text-caption-sm text-error">{varError}</span>}
                  </div>
                </CardBody>
              </Card>

              {/* Sub-KPIs (Metrics) */}
              <MetricEditor
                kpiId={kpiId}
                parentName={draft.name}
                parentUnit={draft.unit}
                parentTargets={parentTargets}
                parentDefaults={parentDefaults}
                canAddMetric={canAddMetric}
                categories={categories}
                committees={committees}
                committeeMemberships={memberships}
                faculty={faculty}
              />
            </div>

            {/* Threshold Settings sidebar */}
            <div className="flex flex-col gap-lg">
              <Card>
                <CardHeader title="Threshold Settings" />
                <CardBody className="flex flex-col gap-lg">
                  <div className="flex flex-col gap-sm">
                    <span className="text-caption-sm text-mute">Preview at 5-year target</span>
                    <ThresholdBar
                      value={draft.fiveYearTarget ?? 0}
                      thresholds={{
                        green: draft.thresholdGreen ?? 0,
                        amber: draft.thresholdAmber ?? 0,
                      }}
                    />
                  </div>
                  <Field label="On-target threshold (≥)">
                    <Input
                      type="number"
                      value={draft.thresholdGreen ?? ""}
                      onChange={(e) =>
                        set(
                          "thresholdGreen",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                  </Field>
                  <Field label="Watch threshold (≥)">
                    <Input
                      type="number"
                      value={draft.thresholdAmber ?? ""}
                      onChange={(e) =>
                        set(
                          "thresholdAmber",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                    />
                  </Field>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Roll-up" />
                <CardBody>
                  <Badge tone={hasChildren ? "info" : "neutral"}>
                    {hasChildren
                      ? `${metrics.length} sub-KPI${metrics.length > 1 ? "s" : ""}`
                      : "Leaf KPI (direct entry)"}
                  </Badge>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </QueryBoundary>
    </>
  );
}

// Sample preview of the roll-up, computed from the sub-KPIs' 5-year targets
// (a Library KPI has no live value — those live in the Performance record).
// Mirrors computeKpiValue's semantics but over targets instead of currentValue.
function computeTargetPreview(
  type: KpiCalculationType,
  metrics: LibraryMetric[],
): number | null {
  // The pooled types have no meaningful target-only preview — pooling targets
  // against themselves would always print 100 (or 1).
  if (type === "custom_formula" || type in POOLED_EXPLAINER || metrics.length === 0)
    return null;
  const vals = metrics.map((m) => ({ w: m.weight, v: m.fiveYearTarget ?? 0 }));
  if (type === "simple_average") {
    return vals.reduce((a, x) => a + x.v, 0) / vals.length;
  }
  // weighted_sum → percent-weighted sum
  return vals.reduce((a, x) => a + (x.w / 100) * x.v, 0);
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
        Preview from {count} sub-KPI{count === 1 ? "" : "s"} · 5-year targets
      </span>
      <span className="text-heading-sm text-on-surface">
        {value === null ? "—" : `${formatNumber(value, 1)} ${unit}`}
      </span>
    </div>
  );
}

function FormulaSummary({ formula }: { formula?: FormulaRecord }) {
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
