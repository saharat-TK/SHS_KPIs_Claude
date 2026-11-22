"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Select } from "@/components/ui";
import {
  useCommittees,
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
import { buildCellLabels } from "@/lib/kpi/academicCatalog";
import type { DataSourceLink } from "@/lib/types";
import {
  LinkMappingSection,
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
  committeeId,
  link,
}: {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
  /** The data source's owning committee — the Committee filter's default. */
  committeeId?: string | null;
  /** Present = edit mode. */
  link?: DataSourceLink | null;
}) {
  const isEdit = !!link;
  const setsQ = useStrategicSets();
  const committeesQ = useCommittees();
  const [setId, setSetId] = useState(0);
  // "" = all committees.
  const [committee, setCommittee] = useState("");
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
      setCommittee(committeeId ?? "");
      setKpiId(0);
      setMetricId(0);
    }
  }, [open, link, committeeId]);

  // Only the chosen committee's KPIs; "All committees" shows every KPI in the set.
  const kpis = useMemo(
    () => (kpisQ.data ?? []).filter((k) => !committee || k.committeeId === committee),
    [kpisQ.data, committee],
  );

  // Only used for the tip naming the aggregation that divides — the mapping
  // itself is the same shape for every target.
  const targetUnit = (kpisQ.data ?? []).find((k) => k.id === kpiId)?.unit ?? null;

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
            committees={committeesQ.data ?? []}
            kpis={kpis}
            metrics={metricsQ.data ?? []}
            setId={setId}
            committee={committee}
            kpiId={kpiId}
            metricId={metricId}
            onSet={(v) => {
              setSetId(v);
              setKpiId(0);
              setMetricId(0);
            }}
            onCommittee={(v) => {
              setCommittee(v);
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

        <LinkMappingSection
          mappings={mappings}
          onChange={setMappings}
          columns={columns}
          entries={entries}
          labels={labels}
          faculty={facultyQ.data ?? []}
          targetUnit={targetUnit}
          note={note}
          onNote={setNote}
        />
      </div>
    </Modal>
  );
}

function TargetPicker({
  sets,
  committees,
  kpis,
  metrics,
  setId,
  committee,
  kpiId,
  metricId,
  onSet,
  onCommittee,
  onKpi,
  onMetric,
}: {
  sets: { id: number; name: string }[];
  committees: { id: string; name: string }[];
  kpis: { id: number; name: string }[];
  metrics: { id: number; name: string }[];
  setId: number;
  committee: string;
  kpiId: number;
  metricId: number;
  onSet: (v: number) => void;
  onCommittee: (v: string) => void;
  onKpi: (v: number) => void;
  onMetric: (v: number) => void;
}) {
  const kpiPlaceholder = !setId
    ? "Select a set first"
    : kpis.length === 0 && committee
      ? "No KPIs for this committee in this set"
      : "Select a KPI…";
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

      <Field label="Committee" hint="Narrows the KPI list to the KPIs this committee owns.">
        <Select value={committee} onChange={(e) => onCommittee(e.target.value)}>
          <option value="">All committees</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="KPI">
        <Select
          value={kpiId || ""}
          disabled={!setId || kpis.length === 0}
          onChange={(e) => onKpi(Number(e.target.value))}
        >
          <option value="">{kpiPlaceholder}</option>
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
