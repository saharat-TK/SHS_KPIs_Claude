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
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import {
  useLibraryKpi,
  useStrategicSet,
  useKpiCategories,
  useKpiTypes,
  useCommittees,
  useCommitteeMemberships,
  useFacultyRecords,
  useFormulas,
  useUpdateLibraryKpi,
  useDeleteLibraryKpi,
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
import { unitNeedsDivisor, DEFAULT_THRESHOLDS } from "@/lib/kpi/progress";
import { weightSumWarning } from "@/lib/kpi/weight";
import { categoriesOfType } from "@/lib/kpi/categories";
import { personsForCommittee } from "@/lib/kpi/committee";
import { useT, type TFunction } from "@/lib/i18n/useT";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { MetricEditor } from "./MetricEditor";

// Display label/hint keys, indexed by the calculation-type id (the id stays the
// logic/DB value — only the copy is translated at render). Mirrors the ids in
// KPI_CALCULATION_TYPES; keep in sync if a calc type is added.
const CALC_LABEL: Record<KpiCalculationType, TranslationKey> = {
  weighted_sum: "kpiDetail.calcType.weighted_sum.label",
  simple_average: "kpiDetail.calcType.simple_average.label",
  percent_of_total: "kpiDetail.calcType.percent_of_total.label",
  ratio_of_total: "kpiDetail.calcType.ratio_of_total.label",
  combined_percent: "kpiDetail.calcType.combined_percent.label",
  combined_ratio: "kpiDetail.calcType.combined_ratio.label",
  custom_formula: "kpiDetail.calcType.custom_formula.label",
};
const CALC_HINT: Record<KpiCalculationType, TranslationKey> = {
  weighted_sum: "kpiDetail.calcType.weighted_sum.hint",
  simple_average: "kpiDetail.calcType.simple_average.hint",
  percent_of_total: "kpiDetail.calcType.percent_of_total.hint",
  ratio_of_total: "kpiDetail.calcType.ratio_of_total.hint",
  combined_percent: "kpiDetail.calcType.combined_percent.hint",
  combined_ratio: "kpiDetail.calcType.combined_ratio.hint",
  custom_formula: "kpiDetail.calcType.custom_formula.hint",
};
// Only the pooled types have an explainer; keys mirror POOLED_EXPLAINER below.
const POOLED_KEY: Partial<Record<KpiCalculationType, TranslationKey>> = {
  percent_of_total: "kpiDetail.calcPooled.percent_of_total",
  ratio_of_total: "kpiDetail.calcPooled.ratio_of_total",
  combined_percent: "kpiDetail.calcPooled.combined_percent",
  combined_ratio: "kpiDetail.calcPooled.combined_ratio",
};
const PERIOD_KEY: Record<CollectionPeriod, TranslationKey> = {
  Q1: "kpiDetail.period.Q1",
  Q2: "kpiDetail.period.Q2",
  Q3: "kpiDetail.period.Q3",
  Q4: "kpiDetail.period.Q4",
  every_quarter: "kpiDetail.period.every_quarter",
};
const QMODE_LABEL: Record<QuarterlyTargetMode, TranslationKey> = {
  divide_equally: "kpiDetail.quarterlyMode.divide_equally.label",
  use_annual: "kpiDetail.quarterlyMode.use_annual.label",
};
const QMODE_HINT: Record<QuarterlyTargetMode, TranslationKey> = {
  divide_equally: "kpiDetail.quarterlyMode.divide_equally.hint",
  use_annual: "kpiDetail.quarterlyMode.use_annual.hint",
};

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
  routineCategoryId: string;
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
    routineCategoryId: k.routineCategoryId ?? "",
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
    // Standard band for anything created before the create route defaulted
    // these. Applied symmetrically to draft and original, so loading the page
    // never looks like an unsaved edit.
    thresholdGreen: k.thresholdGreen ?? DEFAULT_THRESHOLDS.green,
    thresholdAmber: k.thresholdAmber ?? DEFAULT_THRESHOLDS.amber,
  };
}

function KpiDetail() {
  const router = useRouter();
  const t = useT();
  const params = useParams<{ setId: string; kpiId: string }>();
  const setId = Number(params.setId);
  const kpiId = Number(params.kpiId);

  const del = useDeleteLibraryKpi(setId);
  // Stand the query down as soon as the delete is in flight — otherwise it
  // refetches the row being deleted while this page unmounts.
  const kpiQ = useLibraryKpi(kpiId, { enabled: !del.isPending && !del.isSuccess });
  const setQ = useStrategicSet(setId);
  const categoriesQ = useKpiCategories(setId);
  const kpiTypesQ = useKpiTypes();

  // Keep the set name (parent crumb) and KPI name in the breadcrumb; relabel the
  // intermediate "kpis" crumb to "KPIs" (the static map reads it as "KPI Management").
  useBreadcrumbLabel(`/kpi-management/library/${setId}`, setQ.data?.name);
  useBreadcrumbLabel(`/kpi-management/library/${setId}/kpis`, t("kpiDetail.kpisCrumb"));
  useBreadcrumbLabel(`/kpi-management/library/${setId}/kpis/${kpiId}`, kpiQ.data?.name);
  const committeesQ = useCommittees();
  const membershipsQ = useCommitteeMemberships();
  const facultyQ = useFacultyRecords();
  const formulasQ = useFormulas();
  const metricsQ = useLibraryMetrics(kpiId);
  const update = useUpdateLibraryKpi();
  const saveTargets = useSaveLibraryKpiTargets();
  const confirm = useConfirm();

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
      ? t("kpiDetail.capError", {
          year: overCapYear.yearNo,
          value: overCapYear.targetValue.toFixed(2),
          cap: cap.toFixed(2),
        })
      : null;

  // KPI variables (decision: Variable 1 required always; Variable 2 required
  // only when the unit is Percent/Ratio).
  const needsDivisor = draft ? unitNeedsDivisor(draft.unit) : false;
  const varError =
    draft == null
      ? null
      : !draft.variable1Name.trim()
        ? t("kpiDetail.var1Required")
        : needsDivisor && !draft.variable2Name.trim()
          ? t("kpiDetail.var2Required")
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
          routineCategoryId: draft.routineCategoryId || null,
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
          // draftOf renders a blank threshold as the default, so storing NULL
          // here would show up as 100/70 on the next load — the field would
          // look unsaved. Emptying the input means "reset to the standard
          // band", and that is what gets written.
          thresholdGreen: draft.thresholdGreen ?? DEFAULT_THRESHOLDS.green,
          thresholdAmber: draft.thresholdAmber ?? DEFAULT_THRESHOLDS.amber,
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
  // The two independent taxonomies, from the one per-set fetch.
  const strategicCategories = categoriesOfType(categories, "strategic");
  const routineCategories = categoriesOfType(categories, "routine");
  // KPI_TYPES is the offline/loading fallback so the dropdown never renders empty.
  const kpiTypes =
    kpiTypesQ.data?.map((t) => ({ id: t.id, label: t.kpiTypeName })) ?? KPI_TYPES;
  const committees = committeesQ.data ?? [];
  const memberships = membershipsQ.data ?? [];
  const faculty = facultyQ.data ?? [];
  const formulas = formulasQ.data ?? [];
  const metrics = metricsQ.data ?? [];
  const hasChildren = metrics.length > 0;
  // Advisory only — nothing rejects a total other than 100, but weighted_sum
  // scales its answer by it, so the editor is where to say so.
  const weightWarning = weightSumWarning(metrics.map((m) => m.weight));
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
  const saving = update.isPending || saveTargets.isPending;

  // Not gated on `dirty` — the confirmation already says the delete can't be
  // undone, so losing unsaved edits along with it is no surprise.
  const askDelete = async () => {
    // Built inline (not via the shared describeKpiDeletion helper, which other
    // pages still use in English) so the copy follows the active locale.
    const count = metrics.length;
    const subs =
      count > 0
        ? t(
            count === 1
              ? "kpiDetail.deleteSubsPhrase"
              : "kpiDetail.deleteSubsPhrasePlural",
            { count },
          )
        : t("kpiDetail.deleteNoSubsPhrase");
    if (
      await confirm({
        title: t("kpiDetail.deleteConfirmTitle"),
        message: t("kpiDetail.deleteMessage", {
          name: kpiQ.data?.name ?? "this KPI",
          subs,
        }),
        confirmLabel: t("kpiDetail.deleteConfirmLabel"),
        confirmPhrase: "DELETE",
      })
    ) {
      del.mutate(kpiId, {
        onSuccess: () => router.push(`/kpi-management/library/${setId}`),
      });
    }
  };

  return (
    <>
      <PageHeader
        title={kpiQ.data?.name ?? t("kpiDetail.titleFallback")}
        description={t("kpiDetail.headerDescription")}
        actions={
          <>
            <Button
              variant="ghost"
              icon="arrow_back"
              onClick={() => router.push(`/kpi-management/library/${setId}`)}
            >
              {t("kpiDetail.backToSet")}
            </Button>
            <Button
              icon="save"
              disabled={!dirty || !!capError || !!varError || saving}
              onClick={save}
            >
              {saving ? t("kpiDetail.saving") : t("kpiDetail.saveChanges")}
            </Button>
            {/* Icon-only, so not a <Button> — its px-lg padding would render a
                lone icon as a wide red slab. 36px matches Button size="md".
                `enabled:` prefixes keep a disabled bin from lighting up red. */}
            <button
              type="button"
              aria-label={t("kpiDetail.deleteKpi")}
              title={t("kpiDetail.deleteKpi")}
              disabled={saving || del.isPending}
              onClick={askDelete}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-DEFAULT text-mute transition-colors enabled:hover:bg-error/10 enabled:hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="delete" size={18} />
            </button>
          </>
        }
      />

      <QueryBoundary isLoading={kpiQ.isLoading} isError={kpiQ.isError}>
        {draft && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-lg">
            <div className="flex flex-col gap-lg">
              {/* Core Configuration */}
              <Card>
                <CardHeader title={t("kpiDetail.coreConfig")} />
                <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                  <Field label={t("kpiDetail.name")}>
                    <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
                  </Field>
                  <Field label={t("kpiDetail.category")}>
                    <Select
                      value={draft.categoryId}
                      onChange={(e) => set("categoryId", e.target.value)}
                    >
                      <option value="">{t("kpiDetail.uncategorised")}</option>
                      {strategicCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label={t("kpiDetail.routineCategory")}
                    hint={
                      routineCategories.length === 0
                        ? t("kpiDetail.noRoutineCategories")
                        : undefined
                    }
                  >
                    <Select
                      value={draft.routineCategoryId}
                      onChange={(e) => set("routineCategoryId", e.target.value)}
                    >
                      <option value="">{t("kpiDetail.uncategorised")}</option>
                      {routineCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("kpiDetail.kpiType")}>
                    <Select
                      value={draft.kpiType}
                      onChange={(e) => set("kpiType", e.target.value as KpiType)}
                    >
                      {kpiTypes.map((kt) => (
                        <option key={kt.id} value={kt.id}>
                          {kt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("kpiDetail.collectionPeriod")}>
                    <Select
                      value={draft.collectionPeriod}
                      onChange={(e) =>
                        set("collectionPeriod", e.target.value as CollectionPeriod)
                      }
                    >
                      {COLLECTION_PERIODS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {t(PERIOD_KEY[p.id])}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t("kpiDetail.dataCollectMethod")}>
                    <Input
                      value={draft.dataCollectMethod}
                      onChange={(e) => set("dataCollectMethod", e.target.value)}
                      placeholder={t("kpiDetail.placeholderDataMethod")}
                    />
                  </Field>
                  <Field label={t("kpiDetail.dataSourceUrl")}>
                    <Input
                      value={draft.dataSourceUrl}
                      onChange={(e) => set("dataSourceUrl", e.target.value)}
                      placeholder={t("kpiDetail.placeholderUrl")}
                    />
                  </Field>
                  <Field label={t("kpiDetail.committeeInCharge")}>
                    <Select
                      value={draft.committeeId}
                      onChange={(e) => set("committeeId", e.target.value)}
                    >
                      <option value="">{t("kpiDetail.unassigned")}</option>
                      {committees.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label={t("kpiDetail.personInCharge")}
                    hint={
                      !draft.committeeId
                        ? t("kpiDetail.selectCommitteeFirst")
                        : undefined
                    }
                  >
                    <Select
                      value={draft.personInChargeId}
                      disabled={!draft.committeeId}
                      onChange={(e) => set("personInChargeId", e.target.value)}
                    >
                      <option value="">{t("kpiDetail.unassigned")}</option>
                      {personsForCommittee(
                        faculty,
                        memberships,
                        draft.committeeId,
                        draft.personInChargeId,
                      ).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.inCommittee ? "" : t("kpiDetail.notInCommittee")}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={t("kpiDetail.description")}>
                      <Input
                        value={draft.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder={t("kpiDetail.placeholderDescription")}
                      />
                    </Field>
                  </div>
                </CardBody>
              </Card>

              {/* Annual Target (5 years) */}
              <Card>
                <CardHeader
                  title={t("kpiDetail.annualTarget")}
                  subtitle={t("kpiDetail.annualTargetSubtitle")}
                />
                <CardBody className="flex flex-col gap-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
                    <Field label={t("kpiDetail.weight")}>
                      <Input
                        type="number"
                        value={draft.weight}
                        onChange={(e) => set("weight", Number(e.target.value))}
                      />
                    </Field>
                    <Field label={t("kpiDetail.unit")}>
                      <UnitSelect value={draft.unit} onChange={setUnit} />
                    </Field>
                    <Field label={t("kpiDetail.fiveYearTargetCap")}>
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
                      <Field key={i} label={t("kpiDetail.year", { n: i + 1 })}>
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
                      {t("kpiDetail.capCaption", {
                        cap: cap != null ? ` (${cap.toFixed(2)})` : "",
                      })}
                    </span>
                    {capError && <span className="text-error">{capError}</span>}
                  </div>
                </CardBody>
              </Card>

              {/* KPI Calculation Logic */}
              <Card>
                <CardHeader
                  title={t("kpiDetail.calcLogic")}
                  subtitle={t(CALC_LABEL[draft.calculationType])}
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
                        {t("kpiDetail.openInBuilder")}
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
                    options={KPI_CALCULATION_TYPES.map((ct) => ({
                      value: ct.id,
                      label: t(CALC_LABEL[ct.id]),
                      hint: t(CALC_HINT[ct.id]),
                    }))}
                  />
                  {draft.calculationType === "custom_formula" ? (
                    <>
                      <Field label={t("kpiDetail.linkedFormula")}>
                        <Select
                          value={draft.formulaId ?? ""}
                          onChange={(e) =>
                            set(
                              "formulaId",
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                        >
                          <option value="">{t("kpiDetail.selectFormula")}</option>
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
                          t={t}
                        />
                      ) : (
                        <p className="text-body-sm text-mute">
                          {t("kpiDetail.noFormulaLinked")}
                        </p>
                      )}
                      {/* The roll-up returns nothing for this type — see
                          rollupParts in lib/kpi/performance.ts. Saying so here
                          is the difference between "the formula runs" and "the
                          formula documents what someone types in". */}
                      <p className="flex items-start gap-xs text-caption-sm text-mute">
                        <Badge tone="neutral">{t("kpiDetail.noteBadge")}</Badge>
                        <span>{t("kpiDetail.customFormulaNote")}</span>
                      </p>
                    </>
                  ) : POOLED_EXPLAINER[draft.calculationType] ? (
                    <p className="text-body-sm text-mute">
                      {t(POOLED_KEY[draft.calculationType]!)}
                      {t("kpiDetail.pooledNoPreview")}
                    </p>
                  ) : (
                    <AggregateSummary
                      unit={draft.unit}
                      count={metrics.length}
                      value={computeTargetPreview(draft.calculationType, metrics)}
                      t={t}
                    />
                  )}

                  {/* Only weighted_sum reads weight; the others ignore it, so a
                      warning there would be noise. */}
                  {draft.calculationType === "weighted_sum" && weightWarning && (
                    <p className="flex items-start gap-xs text-caption-sm text-mute">
                      <Badge tone="warning">{t("kpiDetail.weightsBadge")}</Badge>
                      <span>
                        {t("kpiDetail.weightWarning", {
                          total: metrics.reduce((a, m) => a + m.weight, 0),
                        })}
                      </span>
                    </p>
                  )}

                  <div className="flex flex-col gap-sm border-t border-hairline pt-lg">
                    <div>
                      <span className="text-label-md text-on-surface">
                        {t("kpiDetail.quarterlyTarget")}
                      </span>
                      <p className="text-caption-sm text-mute mt-tiny">
                        {t("kpiDetail.quarterlyTargetHint")}
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
                          label: t(QMODE_LABEL.divide_equally),
                          hint: t(QMODE_HINT.divide_equally),
                        },
                        {
                          value: "use_annual",
                          label: t(QMODE_LABEL.use_annual),
                          hint: t(QMODE_HINT.use_annual),
                        },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-md border-t border-hairline pt-lg">
                    <div>
                      <span className="text-label-md text-on-surface">
                        {t("kpiDetail.kpiVariables")}
                      </span>
                      <p className="text-caption-sm text-mute mt-tiny">
                        {t("kpiDetail.kpiVariablesHint", {
                          divisor: needsDivisor
                            ? draft.unit.trim().toLowerCase() === "percent"
                              ? t("kpiDetail.divisorPercent")
                              : t("kpiDetail.divisorRatio")
                            : "",
                        })}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-md">
                      <Field label={t("kpiDetail.variable1Name")}>
                        <Input
                          value={draft.variable1Name}
                          onChange={(e) => set("variable1Name", e.target.value)}
                          placeholder={t("kpiDetail.placeholderVar1")}
                        />
                      </Field>
                      <Field label={t("kpiDetail.unit")}>
                        <UnitSelect
                          value={draft.variable1Unit}
                          onChange={(value) => set("variable1Unit", value)}
                        />
                      </Field>
                      <Field label={t("kpiDetail.variable2Name")}>
                        <Input
                          value={needsDivisor ? draft.variable2Name : ""}
                          disabled={!needsDivisor}
                          onChange={(e) => set("variable2Name", e.target.value)}
                          placeholder={
                            needsDivisor
                              ? t("kpiDetail.placeholderVar2")
                              : t("kpiDetail.placeholderVar2Disabled")
                          }
                        />
                      </Field>
                      <Field label={t("kpiDetail.unit")}>
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
                categories={strategicCategories}
                committees={committees}
                committeeMemberships={memberships}
                faculty={faculty}
              />
            </div>

            {/* Threshold Settings sidebar */}
            <div className="flex flex-col gap-lg">
              <Card>
                <CardHeader
                  title={t("kpiDetail.thresholdSettings")}
                  subtitle={t("kpiDetail.thresholdSubtitle")}
                />
                <CardBody className="flex flex-col gap-lg">
                  <div className="flex flex-col gap-sm">
                    <span className="text-caption-sm text-mute">
                      {t("kpiDetail.previewAtTarget")}
                    </span>
                    {/* Hitting the 5-year target exactly IS 100% of target, and
                        ThresholdBar reads `value` as a percent — feeding it the
                        raw fiveYearTarget compared a Ratio of 0.25 against a
                        percent cutoff and painted the bar red. */}
                    <ThresholdBar
                      value={100}
                      max={100}
                      thresholds={{
                        green: draft.thresholdGreen ?? 0,
                        amber: draft.thresholdAmber ?? 0,
                      }}
                    />
                  </div>
                  <Field label={t("kpiDetail.onTargetThreshold")}>
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
                  <Field label={t("kpiDetail.watchThreshold")}>
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
                <CardHeader title={t("kpiDetail.rollup")} />
                <CardBody>
                  <Badge tone={hasChildren ? "info" : "neutral"}>
                    {hasChildren
                      ? t(
                          metrics.length > 1
                            ? "kpiDetail.subKpiCountPlural"
                            : "kpiDetail.subKpiCount",
                          { count: metrics.length },
                        )
                      : t("kpiDetail.leafKpi")}
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
  t,
}: {
  value: number | null;
  count: number;
  unit: string;
  t: TFunction;
}) {
  if (count === 0) {
    return (
      <p className="text-body-sm text-mute">
        {t("kpiDetail.noSubKpisAggregate")}
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-soft border border-hairline px-md py-sm">
      <span className="text-body-sm text-mute">
        {t(count === 1 ? "kpiDetail.previewFrom" : "kpiDetail.previewFromPlural", {
          count,
        })}
      </span>
      <span className="text-heading-sm text-on-surface">
        {value === null ? "—" : `${formatNumber(value, 1)} ${unit}`}
      </span>
    </div>
  );
}

function FormulaSummary({ formula, t }: { formula?: FormulaRecord; t: TFunction }) {
  if (!formula)
    return <p className="text-body-sm text-mute">{t("kpiDetail.formulaNotFound")}</p>;
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
