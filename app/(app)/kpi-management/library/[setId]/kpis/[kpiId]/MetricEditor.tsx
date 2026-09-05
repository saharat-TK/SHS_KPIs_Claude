"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  Th,
  Td,
  Tr,
  Modal,
  Field,
  Input,
  Select,
  UnitSelect,
  RadioGroup,
  QueryBoundary,
  EmptyState,
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { BASE_PATH } from "@/lib/basePath";
import {
  useAcademicCatalog,
  useLibraryMetrics,
  useCreateLibraryMetric,
  useUpdateLibraryMetric,
  useDeleteLibraryMetric,
  useSaveLibraryMetricTargets,
} from "@/lib/data/hooks";
import {
  COLLECTION_PERIODS,
  type CollectionPeriod,
  type Committee,
  type CommitteeMembership,
  type FacultyRecord,
  type LibraryMetric,
  type AnnualTarget,
  type MetricTargetMode,
} from "@/lib/types";
import { personsForCommittee } from "@/lib/kpi/committee";

function toYearSlots(targets: AnnualTarget[] | undefined): (number | null)[] {
  const slots: (number | null)[] = [null, null, null, null, null];
  (targets ?? []).forEach((t) => {
    if (t.yearNo >= 1 && t.yearNo <= 5) slots[t.yearNo - 1] = t.targetValue;
  });
  return slots;
}

type ParentTargets = {
  fiveYearTarget: number | null;
  years: (number | null)[];
};

type ParentDefaults = {
  categoryId: string;
  collectionPeriod: CollectionPeriod;
  committeeId: string;
  dataCollectMethod: string;
  dataSourceUrl: string;
};

const ZERO_YEARS: (number | null)[] = [0, 0, 0, 0, 0];

// Batch presets — each entry prefixes `${abbr}-` onto the parent KPI's name.
// `label` is the Thai program/curriculum name, shown for reference in the dialog.
// Both lists come from the academic catalog tables, the same source the
// program/curriculum data-source columns use, so they cannot drift apart.
type BatchEntry = { abbr: string; label: string };

const TARGET_MODE_OPTIONS: {
  value: MetricTargetMode;
  label: string;
  hint: string;
}[] = [
  {
    value: "none",
    label: "No target",
    hint: "Save zero target values for this sub-KPI.",
  },
  {
    value: "inherit_parent",
    label: "Get from Parent",
    hint: "Use the parent KPI's 5-year and annual targets.",
  },
  {
    value: "manual",
    label: "Manually input",
    hint: "Enter this sub-KPI's own target values.",
  },
];

export function MetricEditor({
  kpiId,
  parentName,
  parentUnit,
  parentTargets,
  parentDefaults,
  canAddMetric = true,
  categories,
  committees,
  committeeMemberships,
  faculty,
}: {
  kpiId: number;
  parentName: string;
  parentUnit: string;
  parentTargets: ParentTargets;
  parentDefaults: ParentDefaults;
  canAddMetric?: boolean;
  categories: { id: string; label: string }[];
  committees: Committee[];
  committeeMemberships: CommitteeMembership[];
  faculty: FacultyRecord[];
}) {
  const metricsQ = useLibraryMetrics(kpiId);
  const del = useDeleteLibraryMetric(kpiId);
  const confirm = useConfirm();
  const [editing, setEditing] = useState<LibraryMetric | null>(null);
  const [creating, setCreating] = useState(false);
  const [batch, setBatch] = useState<{ title: string; entries: BatchEntry[] } | null>(null);

  const metrics = metricsQ.data ?? [];
  const catalogQ = useAcademicCatalog();
  const toBatchEntry = (e: { code: string; label: string }): BatchEntry => ({
    abbr: e.code,
    label: e.label,
  });
  const programBatch = (catalogQ.data?.programs ?? []).map(toBatchEntry);
  const curriculumBatch = (catalogQ.data?.curricula ?? []).map(toBatchEntry);
  // The presets are useless until the catalog arrives, so gate on it too.
  const canStartBatch = canAddMetric && !!catalogQ.data;
  const batchTooltip = !canAddMetric
    ? "Save the parent KPI before adding sub-KPIs"
    : !catalogQ.data
      ? catalogQ.isError
        ? "Could not load the academic catalog"
        : "Loading the academic catalog…"
      : undefined;

  return (
    <Card>
      <CardHeader
        title="Sub-KPIs (Metrics)"
        subtitle="Component metrics that roll up into this KPI."
        actions={
          <div className="flex flex-wrap items-center gap-sm">
            <Button
              size="sm"
              variant="secondary"
              icon="groups"
              disabled={!canStartBatch}
              title={batchTooltip}
              onClick={() => setBatch({ title: "Batch: 5 Programs", entries: programBatch })}
            >
              Batch: 5 Programs
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon="school"
              disabled={!canStartBatch}
              title={batchTooltip}
              onClick={() =>
                setBatch({ title: "Batch: 9 Curriculums", entries: curriculumBatch })
              }
            >
              Batch: 9 Curriculums
            </Button>
            <Button
              size="sm"
              icon="add"
              disabled={!canAddMetric}
              title={batchTooltip}
              onClick={() => setCreating(true)}
            >
              Add Sub-KPI
            </Button>
          </div>
        }
      />
      <CardBody className="p-0">
        <QueryBoundary isLoading={metricsQ.isLoading} isError={metricsQ.isError}>
          {metrics.length === 0 ? (
            <div className="p-lg">
              <EmptyState
                title="No sub-KPIs"
                message="This KPI takes direct quarterly entry until you add sub-KPIs."
              />
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th align="center">Weight</Th>
                  <Th align="center">Unit</Th>
                  <Th align="right">5-Yr Target</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <Tr key={m.id}>
                    <Td className="font-medium">{m.name}</Td>
                    <Td align="center">{m.weight}%</Td>
                    <Td align="center">{m.unit ?? "—"}</Td>
                    <Td align="right">
                      {m.fiveYearTarget != null ? m.fiveYearTarget.toFixed(2) : "—"}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-xs">
                        <button
                          type="button"
                          aria-label="Edit"
                          className="text-mute hover:text-on-surface"
                          onClick={() => setEditing(m)}
                        >
                          <Icon name="edit" size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          className="text-mute hover:text-error"
                          onClick={async () => {
                            if (
                              await confirm({
                                title: "Delete sub-KPI",
                                message: `Delete sub-KPI "${m.name}"? This can't be undone.`,
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
      </CardBody>

      {(creating || editing) && (
        <MetricModal
          kpiId={kpiId}
          metric={editing}
          parentTargets={parentTargets}
          parentDefaults={parentDefaults}
          categories={categories}
          committees={committees}
          committeeMemberships={committeeMemberships}
          faculty={faculty}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {batch && (
        <BatchConfirmModal
          kpiId={kpiId}
          title={batch.title}
          entries={batch.entries}
          parentName={parentName}
          parentUnit={parentUnit}
          parentDefaults={parentDefaults}
          existingNames={metrics.map((m) => m.name)}
          onClose={() => setBatch(null)}
        />
      )}
    </Card>
  );
}

function BatchConfirmModal({
  kpiId,
  title,
  entries,
  parentName,
  parentUnit,
  parentDefaults,
  existingNames,
  onClose,
}: {
  kpiId: number;
  title: string;
  entries: BatchEntry[];
  parentName: string;
  parentUnit: string;
  parentDefaults: ParentDefaults;
  existingNames: string[];
  onClose: () => void;
}) {
  const create = useCreateLibraryMetric();
  const existing = new Set(existingNames);

  const rows = entries.map((e) => {
    const name = `${e.abbr}-${parentName}`;
    return { ...e, name, duplicate: existing.has(name) };
  });
  const toCreate = rows.filter((r) => !r.duplicate);

  const onCreate = async () => {
    for (const row of toCreate) {
      await create.mutateAsync({
        kpiId,
        name: row.name,
        categoryId: parentDefaults.categoryId || null,
        weight: 100,
        unit: parentUnit,
        collectionPeriod: parentDefaults.collectionPeriod,
        committeeId: parentDefaults.committeeId || null,
        personInChargeId: null,
        dataCollectMethod: parentDefaults.dataCollectMethod,
        dataSourceUrl: parentDefaults.dataSourceUrl,
        description: "",
        fiveYearTarget: null,
        targetMode: "manual",
        thresholdGreen: null,
        thresholdAmber: null,
      });
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      subtitle={`Each sub-KPI is named “${parentName}” prefixed with its abbreviation. Inherits the parent's category, committee, collection period, data method, source and unit; weight 100, blank targets.`}
      size="mdWide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            disabled={toCreate.length === 0 || create.isPending}
            onClick={onCreate}
          >
            {create.isPending
              ? "Creating…"
              : `Create ${toCreate.length} Sub-KPI${toCreate.length === 1 ? "" : "s"}`}
          </Button>
        </>
      }
    >
      <Table>
        <thead>
          <tr>
            <Th>Sub-KPI name</Th>
            <Th>Program / Curriculum</Th>
            <Th align="right">Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.abbr}>
              <Td className={r.duplicate ? "text-mute" : "font-medium"}>{r.name}</Td>
              <Td className="text-mute">{r.label}</Td>
              <Td align="right">
                {r.duplicate ? (
                  <span className="text-caption-sm text-mute">already exists — skipped</span>
                ) : (
                  <span className="text-caption-sm text-success">will be created</span>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Modal>
  );
}

function MetricModal({
  kpiId,
  metric,
  parentTargets,
  parentDefaults,
  categories,
  committees,
  committeeMemberships,
  faculty,
  onClose,
}: {
  kpiId: number;
  metric: LibraryMetric | null;
  parentTargets: ParentTargets;
  parentDefaults: ParentDefaults;
  categories: { id: string; label: string }[];
  committees: Committee[];
  committeeMemberships: CommitteeMembership[];
  faculty: FacultyRecord[];
  onClose: () => void;
}) {
  const create = useCreateLibraryMetric();
  const update = useUpdateLibraryMetric();
  const saveTargets = useSaveLibraryMetricTargets(kpiId);

  const [name, setName] = useState(metric?.name ?? "");
  const [categoryId, setCategoryId] = useState(metric?.categoryId ?? parentDefaults.categoryId);
  const [weight, setWeight] = useState(metric?.weight ?? 100);
  const [unit, setUnit] = useState(metric?.unit?.trim() || "Item");
  const [collectionPeriod, setCollectionPeriod] = useState<CollectionPeriod>(
    metric?.collectionPeriod ?? parentDefaults.collectionPeriod,
  );
  const [committeeId, setCommitteeId] = useState(metric?.committeeId ?? parentDefaults.committeeId);
  const [personInChargeId, setPersonInChargeId] = useState(metric?.personInChargeId ?? "");
  const [dataCollectMethod, setDataCollectMethod] = useState(
    metric?.dataCollectMethod ?? parentDefaults.dataCollectMethod,
  );
  const [dataSourceUrl, setDataSourceUrl] = useState(
    metric?.dataSourceUrl ?? parentDefaults.dataSourceUrl,
  );
  const [description, setDescription] = useState(metric?.description ?? "");
  const [fiveYearTarget, setFiveYearTarget] = useState<number | null>(
    metric?.fiveYearTarget ?? null,
  );
  const [targetMode, setTargetMode] = useState<MetricTargetMode>(
    metric?.targetMode ?? "manual",
  );
  const [thresholdGreen, setThresholdGreen] = useState<number | null>(metric?.thresholdGreen ?? null);
  const [thresholdAmber, setThresholdAmber] = useState<number | null>(metric?.thresholdAmber ?? null);
  const [years, setYears] = useState<(number | null)[]>(toYearSlots(metric?.annualTargets));

  // Editing an existing metric: fetch its annual targets (list rows don't carry them).
  useEffect(() => {
    if (metric) {
      fetch(`${BASE_PATH}/api/library-metrics/${metric.id}`)
        .then((r) => r.json())
        .then((full: LibraryMetric) => {
          setTargetMode(full.targetMode ?? "manual");
          setFiveYearTarget(full.fiveYearTarget ?? null);
          setYears(toYearSlots(full.annualTargets));
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric?.id]);

  useEffect(() => {
    if (targetMode === "none") {
      setFiveYearTarget(0);
      setYears([...ZERO_YEARS]);
      return;
    }
    if (targetMode === "inherit_parent") {
      setFiveYearTarget(parentTargets.fiveYearTarget);
      setYears([...parentTargets.years]);
    }
  }, [parentTargets.fiveYearTarget, parentTargets.years, targetMode]);

  const overCapYear =
    fiveYearTarget == null
      ? null
      : years
          .map((targetValue, index) => ({ yearNo: index + 1, targetValue }))
          .find(({ targetValue }) => targetValue != null && targetValue > fiveYearTarget);
  const capError =
    fiveYearTarget != null && overCapYear?.targetValue != null
      ? `Year ${overCapYear.yearNo} target (${overCapYear.targetValue.toFixed(2)}) must not exceed the 5-year target (${fiveYearTarget.toFixed(2)}).`
      : null;

  const submitting = create.isPending || update.isPending || saveTargets.isPending;
  const weightValid = Number.isInteger(weight) && weight >= 1 && weight <= 100;
  const valid = name.trim().length > 1 && weightValid && !capError;
  const targetInputsDisabled = targetMode !== "manual";

  const persistTargets = (id: number) =>
    saveTargets.mutate(
      { id, targets: years.map((v, i) => ({ yearNo: i + 1, targetValue: v })) },
      { onSuccess: onClose },
    );

  const onSave = () => {
    const payload = {
      name: name.trim(),
      categoryId: categoryId || null,
      weight,
      unit,
      collectionPeriod,
      committeeId: committeeId || null,
      personInChargeId: personInChargeId || null,
      dataCollectMethod,
      dataSourceUrl,
      description,
      fiveYearTarget,
      targetMode,
      thresholdGreen,
      thresholdAmber,
    };
    if (metric) {
      update.mutate(
        { id: metric.id, patch: payload },
        { onSuccess: () => persistTargets(metric.id) },
      );
    } else {
      create.mutate(
        { kpiId, ...payload },
        { onSuccess: (created) => persistTargets((created as LibraryMetric).id) },
      );
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={metric ? "Edit Sub-KPI" : "Add Sub-KPI"}
      subtitle="Sub-KPIs carry their own targets and thresholds."
      size="mdWide"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || submitting} onClick={onSave}>
            {submitting ? "Saving…" : metric ? "Save Sub-KPI" : "Create Sub-KPI"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Collection Period">
            <Select
              value={collectionPeriod}
              onChange={(e) => setCollectionPeriod(e.target.value as CollectionPeriod)}
            >
              {COLLECTION_PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Committee in Charge">
            <Select value={committeeId} onChange={(e) => setCommitteeId(e.target.value)}>
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
              !committeeId
                ? "Select a committee in charge first to choose a person."
                : undefined
            }
          >
            <Select
              value={personInChargeId}
              disabled={!committeeId}
              onChange={(e) => setPersonInChargeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {personsForCommittee(
                faculty,
                committeeMemberships,
                committeeId,
                personInChargeId,
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.inCommittee ? "" : " — not in committee"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data Collecting Method">
            <Input
              value={dataCollectMethod}
              onChange={(e) => setDataCollectMethod(e.target.value)}
            />
          </Field>
          <Field label="Data Source (URL)">
            <Input value={dataSourceUrl} onChange={(e) => setDataSourceUrl(e.target.value)} />
          </Field>
        </div>
        <Field label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-lg">
          <Field label="Weight (%)">
            <Input
              type="number"
              min={1}
              max={100}
              step={1}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </Field>
          <Field label="Unit">
            <UnitSelect value={unit} onChange={setUnit} />
          </Field>
          <Field label="On-target (≥)">
            <Input
              type="number"
              value={thresholdGreen ?? ""}
              onChange={(e) =>
                setThresholdGreen(e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Watch (≥)">
            <Input
              type="number"
              value={thresholdAmber ?? ""}
              onChange={(e) =>
                setThresholdAmber(e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
        </div>

        <h3 className="text-label-md text-on-surface">Target</h3>
        <RadioGroup
          name="metricTargetMode"
          value={targetMode}
          onChange={setTargetMode}
          options={TARGET_MODE_OPTIONS}
        />

        <Field label="5-Year Target (cap)">
          <Input
            type="number"
            step="0.01"
            value={fiveYearTarget ?? ""}
            disabled={targetInputsDisabled}
            onChange={(e) =>
              setFiveYearTarget(e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-md">
          {years.map((v, i) => (
            <Field key={i} label={`Year ${i + 1}`}>
              <Input
                type="number"
                step="0.01"
                value={v ?? ""}
                disabled={targetInputsDisabled}
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
            {fiveYearTarget != null && <> ({fiveYearTarget.toFixed(2)})</>}.
          </span>
          {capError && <span className="text-error">{capError}</span>}
        </div>
      </div>
    </Modal>
  );
}
