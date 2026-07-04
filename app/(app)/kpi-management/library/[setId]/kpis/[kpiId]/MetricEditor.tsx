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
  QueryBoundary,
  EmptyState,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
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
  type FacultyRecord,
  type LibraryMetric,
  type AnnualTarget,
} from "@/lib/types";

function toYearSlots(targets: AnnualTarget[] | undefined): (number | null)[] {
  const slots: (number | null)[] = [null, null, null, null, null];
  (targets ?? []).forEach((t) => {
    if (t.yearNo >= 1 && t.yearNo <= 5) slots[t.yearNo - 1] = t.targetValue;
  });
  return slots;
}

export function MetricEditor({
  kpiId,
  categories,
  committees,
  faculty,
}: {
  kpiId: number;
  categories: { id: string; label: string }[];
  committees: Committee[];
  faculty: FacultyRecord[];
}) {
  const metricsQ = useLibraryMetrics(kpiId);
  const del = useDeleteLibraryMetric(kpiId);
  const [editing, setEditing] = useState<LibraryMetric | null>(null);
  const [creating, setCreating] = useState(false);

  const metrics = metricsQ.data ?? [];

  return (
    <Card>
      <CardHeader
        title="Sub-KPIs (Metrics)"
        subtitle="Component metrics that roll up into this KPI."
        actions={
          <Button size="sm" icon="add" onClick={() => setCreating(true)}>
            Add Sub-KPI
          </Button>
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
                          onClick={() => {
                            if (confirm(`Delete sub-KPI "${m.name}"?`)) del.mutate(m.id);
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
          categories={categories}
          committees={committees}
          faculty={faculty}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </Card>
  );
}

function MetricModal({
  kpiId,
  metric,
  categories,
  committees,
  faculty,
  onClose,
}: {
  kpiId: number;
  metric: LibraryMetric | null;
  categories: { id: string; label: string }[];
  committees: Committee[];
  faculty: FacultyRecord[];
  onClose: () => void;
}) {
  const create = useCreateLibraryMetric();
  const update = useUpdateLibraryMetric();
  const saveTargets = useSaveLibraryMetricTargets(kpiId);

  const [name, setName] = useState(metric?.name ?? "");
  const [categoryId, setCategoryId] = useState(metric?.categoryId ?? "");
  const [weight, setWeight] = useState(metric?.weight ?? 10);
  const [unit, setUnit] = useState(metric?.unit ?? "%");
  const [collectionPeriod, setCollectionPeriod] = useState<CollectionPeriod>(
    metric?.collectionPeriod ?? "every_quarter",
  );
  const [committeeId, setCommitteeId] = useState(metric?.committeeId ?? "");
  const [personInChargeId, setPersonInChargeId] = useState(metric?.personInChargeId ?? "");
  const [dataCollectMethod, setDataCollectMethod] = useState(metric?.dataCollectMethod ?? "");
  const [dataSourceUrl, setDataSourceUrl] = useState(metric?.dataSourceUrl ?? "");
  const [description, setDescription] = useState(metric?.description ?? "");
  const [fiveYearTarget, setFiveYearTarget] = useState<number | null>(
    metric?.fiveYearTarget ?? null,
  );
  const [thresholdGreen, setThresholdGreen] = useState<number | null>(metric?.thresholdGreen ?? null);
  const [thresholdAmber, setThresholdAmber] = useState<number | null>(metric?.thresholdAmber ?? null);
  const [years, setYears] = useState<(number | null)[]>(toYearSlots(metric?.annualTargets));

  // Editing an existing metric: fetch its annual targets (list rows don't carry them).
  useEffect(() => {
    if (metric) {
      fetch(`/api/library-metrics/${metric.id}`)
        .then((r) => r.json())
        .then((full: LibraryMetric) => setYears(toYearSlots(full.annualTargets)))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric?.id]);

  const yearSum = years.reduce<number>((a, v) => a + (v ?? 0), 0);
  const capError =
    fiveYearTarget != null &&
    (yearSum > fiveYearTarget || years.some((v) => v != null && v > fiveYearTarget))
      ? `Annual targets (sum ${yearSum.toFixed(2)}) must not exceed the 5-year target (${fiveYearTarget.toFixed(2)}).`
      : null;

  const submitting = create.isPending || update.isPending || saveTargets.isPending;
  const valid = name.trim().length > 1 && !capError;

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
          <Field label="Person in Charge">
            <Select
              value={personInChargeId}
              onChange={(e) => setPersonInChargeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
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
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </Field>
          <Field label="Unit">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
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

        <Field label="5-Year Target (cap)">
          <Input
            type="number"
            step="0.01"
            value={fiveYearTarget ?? ""}
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
                onChange={(e) => {
                  const next = [...years];
                  next[i] = e.target.value === "" ? null : Number(e.target.value);
                  setYears(next);
                }}
              />
            </Field>
          ))}
        </div>
        {capError && <span className="text-caption-sm text-error">{capError}</span>}
      </div>
    </Modal>
  );
}
