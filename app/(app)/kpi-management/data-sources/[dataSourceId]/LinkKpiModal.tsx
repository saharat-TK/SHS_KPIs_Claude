"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import {
  useCreateDataSourceLink,
  useDataSourceColumns,
  useDataSourceEntries,
  useFacultyRecords,
  useAcademicCatalog,
  useLibraryKpis,
  useLibraryMetrics,
  useStrategicSets,
  useUpdateDataSourceLink,
} from "@/lib/data/hooks";
import { unitNeedsDivisor } from "@/lib/kpi/progress";
import { buildCellLabels } from "@/lib/kpi/academicCatalog";
import type { DataSourceLink, MappingSlot } from "@/lib/types";
import {
  MappingCard,
  newMapping,
  toDraft,
  toPayload,
  type DraftMapping,
} from "./LinkMappingEditor";

/** Link this data source to a library KPI or metric, and say which of its rows
 *  produce that target's quarterly value. Editing a link keeps its target — the
 *  unique key is built on it — and changes only the mappings. */
export function LinkKpiModal({
  open,
  onClose,
  dataSourceId,
  link,
}: {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
  /** Present = edit mode. */
  link?: DataSourceLink | null;
}) {
  const isEdit = !!link;
  const setsQ = useStrategicSets();
  const [setId, setSetId] = useState(0);
  const [kpiId, setKpiId] = useState(0);
  const [metricId, setMetricId] = useState(0);
  const [note, setNote] = useState("");
  const [mappings, setMappings] = useState<DraftMapping[]>([]);

  const kpisQ = useLibraryKpis(setId);
  const metricsQ = useLibraryMetrics(kpiId);
  const columnsQ = useDataSourceColumns(dataSourceId);
  const entriesQ = useDataSourceEntries(dataSourceId);
  const facultyQ = useFacultyRecords();
  const catalogQ = useAcademicCatalog();
  const create = useCreateDataSourceLink();
  const update = useUpdateDataSourceLink();

  const columns = useMemo(() => columnsQ.data ?? [], [columnsQ.data]);
  const entries = useMemo(() => entriesQ.data ?? [], [entriesQ.data]);
  const labels = useMemo(() => buildCellLabels(facultyQ.data ?? [], catalogQ.data), [facultyQ.data, catalogQ.data]);

  useEffect(() => {
    if (!open) return;
    setNote(link?.note ?? "");
    setMappings((link?.mappings ?? []).map(toDraft));
    if (!link) {
      setSetId(0);
      setKpiId(0);
      setMetricId(0);
    }
  }, [open, link]);

  // A percent/ratio KPI can be fed as two variables instead of one value.
  const selectedKpi = (kpisQ.data ?? []).find((k) => k.id === kpiId);
  const allowsVariables =
    !isEdit && !metricId && unitNeedsDivisor(selectedKpi?.unit ?? null);

  const updateMapping = (key: string, patch: Partial<DraftMapping>) =>
    setMappings((ms) => ms.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  const submitting = create.isPending || update.isPending;
  const valid = isEdit || kpiId > 0;

  const submit = () => {
    const payload = mappings.map(toPayload);
    if (isEdit && link) {
      update.mutate(
        {
          dataSourceId,
          linkId: link.id,
          patch: { mappings: payload, note: note.trim() || null },
        },
        { onSuccess: onClose },
      );
      return;
    }
    create.mutate(
      {
        id: dataSourceId,
        input: {
          ...(metricId > 0 ? { libraryMetricId: metricId } : { libraryKpiId: kpiId }),
          mappings: payload,
          note: note.trim() || undefined,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit Link" : "Link to a KPI"}
      subtitle={
        isEdit
          ? `Which rows of this data source produce “${link?.metricName || link?.kpiName}”.`
          : "Pick the target, then say which rows count toward it. Leave the mapping empty to record the link as evidence only."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || submitting} onClick={submit}>
            {submitting ? "Saving…" : isEdit ? "Save Link" : "Link"}
          </Button>
        </>
      }
    >
      <div className="grid gap-md">
        {isEdit ? (
          <div className="rounded-md border border-hairline bg-surface-lowest px-md py-sm text-body-sm">
            <span className="text-mute">Feeding </span>
            <span className="font-medium">{link?.metricName || link?.kpiName}</span>
            {link?.setName && <span className="text-mute"> · {link.setName}</span>}
          </div>
        ) : (
          <TargetPicker
            sets={setsQ.data ?? []}
            kpis={kpisQ.data ?? []}
            metrics={metricsQ.data ?? []}
            setId={setId}
            kpiId={kpiId}
            metricId={metricId}
            onSet={(v) => {
              setSetId(v);
              setKpiId(0);
              setMetricId(0);
            }}
            onKpi={(v) => {
              setKpiId(v);
              setMetricId(0);
            }}
            onMetric={setMetricId}
          />
        )}

        <div className="border-t border-hairline pt-md">
          <div className="mb-sm flex items-center justify-between">
            <div>
              <h3 className="text-label-md text-on-surface">Which rows count</h3>
              <p className="text-caption-sm text-mute">
                Matching rows are aggregated into the quarterly value, cumulatively
                within each year.
              </p>
            </div>
            {mappings.length < (allowsVariables ? 2 : 1) && (
              <Button
                size="sm"
                variant="ghost"
                icon="add"
                onClick={() =>
                  setMappings((ms) => [
                    ...ms,
                    newMapping(
                      allowsVariables
                        ? ms.some((m) => m.slot === "variable1")
                          ? "variable2"
                          : "variable1"
                        : "value",
                    ),
                  ])
                }
              >
                Add mapping
              </Button>
            )}
          </div>

          {columns.length === 0 ? (
            <p className="text-body-sm text-mute">
              This data source has no columns yet, so there is nothing to filter on.
            </p>
          ) : mappings.length === 0 ? (
            <p className="text-body-sm text-mute">
              No mapping — this link is evidence only and will not change any value.
            </p>
          ) : (
            <div className="flex flex-col gap-md">
              {mappings.map((m) => (
                <MappingCard
                  key={m.key}
                  mapping={m}
                  columns={columns}
                  entries={entries}
                  labels={labels}
                  faculty={facultyQ.data ?? []}
                  allowsVariables={allowsVariables}
                  onChange={(patch) => updateMapping(m.key, patch)}
                  onRemove={() =>
                    setMappings((ms) => ms.filter((x) => x.key !== m.key))
                  }
                />
              ))}
            </div>
          )}
        </div>

        <Field label="Note" hint="Optional — how this data supports the KPI.">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function TargetPicker({
  sets,
  kpis,
  metrics,
  setId,
  kpiId,
  metricId,
  onSet,
  onKpi,
  onMetric,
}: {
  sets: { id: number; name: string }[];
  kpis: { id: number; name: string }[];
  metrics: { id: number; name: string }[];
  setId: number;
  kpiId: number;
  metricId: number;
  onSet: (v: number) => void;
  onKpi: (v: number) => void;
  onMetric: (v: number) => void;
}) {
  return (
    <>
      <Field label="Strategic set">
        <Select value={setId || ""} onChange={(e) => onSet(Number(e.target.value))}>
          <option value="">Select a set…</option>
          {sets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="KPI">
        <Select
          value={kpiId || ""}
          disabled={!setId}
          onChange={(e) => onKpi(Number(e.target.value))}
        >
          <option value="">{setId ? "Select a KPI…" : "Select a set first"}</option>
          {kpis.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Metric" hint="Optional — leave blank to feed the KPI itself.">
        <Select
          value={metricId || ""}
          disabled={!kpiId || metrics.length === 0}
          onChange={(e) => onMetric(Number(e.target.value))}
        >
          <option value="">The KPI itself</option>
          {metrics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
