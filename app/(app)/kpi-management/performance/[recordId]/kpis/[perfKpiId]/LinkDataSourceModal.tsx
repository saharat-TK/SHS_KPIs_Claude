"use client";

// The mirror image of LinkKpiModal: there you pick a KPI for a data source,
// here you pick a data source for a KPI (or one of its sub-KPIs). Both build the
// same DataSourceLinkMapping[] through the shared LinkMappingEditor, and both
// POST to /api/data-sources/[id]/links — the data source is the path param and
// the target is the body, so reverse mode varies the path instead of the body.
import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Input, Select, Badge } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  useCreateDataSourceLink,
  useDataSourceColumns,
  useDataSourceEntries,
  useDataSources,
  useFacultyRecords,
} from "@/lib/data/hooks";
import { unitNeedsDivisor } from "@/lib/kpi/progress";
import { buildCellLabels } from "@/lib/kpi/programs";
import type { PerfKpi, PerfMetric } from "@/lib/types";
import {
  MappingCard,
  SLOT_LABELS,
  newMapping,
  toPayload,
  type DraftMapping,
} from "@/app/(app)/kpi-management/data-sources/[dataSourceId]/LinkMappingEditor";

/** Link a data source to this KPI or one of its sub-KPIs. The target is fixed by
 *  the page; only the source and its mapping are chosen here. */
export function LinkDataSourceModal({
  open,
  onClose,
  kpi,
  metrics,
  linkedSourceIds,
}: {
  open: boolean;
  onClose: () => void;
  kpi: PerfKpi;
  metrics: PerfMetric[];
  /** Sources already linked to this KPI — offered but flagged, since a second
   *  link to the same target would collide with uq_ds_link. */
  linkedSourceIds: number[];
}) {
  const [dataSourceId, setDataSourceId] = useState(0);
  // "" = the KPI itself; otherwise a perf metric id.
  const [metricId, setMetricId] = useState(0);
  const [note, setNote] = useState("");
  const [mappings, setMappings] = useState<DraftMapping[]>([]);

  const sourcesQ = useDataSources();
  const columnsQ = useDataSourceColumns(dataSourceId);
  const entriesQ = useDataSourceEntries(dataSourceId);
  const facultyQ = useFacultyRecords();
  const create = useCreateDataSourceLink();

  const columns = useMemo(() => columnsQ.data ?? [], [columnsQ.data]);
  const entries = useMemo(() => entriesQ.data ?? [], [entriesQ.data]);
  const labels = useMemo(() => buildCellLabels(facultyQ.data ?? []), [facultyQ.data]);

  useEffect(() => {
    if (!open) return;
    setDataSourceId(0);
    setMetricId(0);
    setNote("");
    setMappings([]);
  }, [open]);

  // The link targets the LIBRARY row this record was snapshotted from, never the
  // perf row. A KPI created straight on a record has no library twin.
  const selectedMetric = metrics.find((m) => m.id === metricId) ?? null;
  const targetLibraryKpiId = kpi.sourceKpiId ?? null;
  const targetLibraryMetricId = selectedMetric?.sourceMetricId ?? null;
  const targetMissing = metricId > 0 ? targetLibraryMetricId == null : targetLibraryKpiId == null;

  // A percent/ratio target can be fed as two variables instead of one value.
  const targetUnit = selectedMetric ? selectedMetric.unit : kpi.unit;
  const allowsVariables = unitNeedsDivisor(targetUnit ?? null);

  const updateMapping = (key: string, patch: Partial<DraftMapping>) =>
    setMappings((ms) => ms.map((m) => (m.key === key ? { ...m, ...patch } : m)));

  const alreadyLinked = dataSourceId > 0 && linkedSourceIds.includes(dataSourceId);
  const valid = dataSourceId > 0 && !targetMissing;

  const submit = () =>
    create.mutate(
      {
        id: dataSourceId,
        input: {
          ...(metricId > 0
            ? { libraryMetricId: targetLibraryMetricId as number }
            : { libraryKpiId: targetLibraryKpiId as number }),
          mappings: mappings.map(toPayload),
          note: note.trim() || undefined,
        },
      },
      { onSuccess: onClose },
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Link a Data Source"
      subtitle="Pick the source, then say which of its rows count toward this KPI. Leave the mapping empty to record the link as evidence only."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || create.isPending} onClick={submit}>
            {create.isPending ? "Saving…" : "Link"}
          </Button>
        </>
      }
    >
      <div className="grid gap-md">
        <div className="flex items-start gap-sm rounded-md border border-[#e9c98a] bg-[#fbeed6] px-md py-sm text-caption-sm text-[#8a4b00]">
          <Icon name="warning" className="mt-tiny shrink-0 text-[16px]" />
          <span>
            A link belongs to the KPI itself, not to this performance record. It
            applies everywhere the KPI appears, and its values are recomputed for
            every active record as soon as you save.
          </span>
        </div>

        <Field label="Data source">
          <Select
            value={dataSourceId || ""}
            onChange={(e) => setDataSourceId(Number(e.target.value))}
          >
            <option value="">Select a data source…</option>
            {(sourcesQ.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.committeeName ? ` — ${s.committeeName}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Feeds"
          hint="Which part of this KPI the source produces a value for."
        >
          <Select value={metricId || ""} onChange={(e) => setMetricId(Number(e.target.value))}>
            <option value="">This KPI ({kpi.name})</option>
            {metrics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>

        {targetMissing && (
          <p className="text-body-sm text-error">
            {metricId > 0
              ? "This sub-KPI was not snapshotted from the library, so there is nothing to link to."
              : "This KPI was not snapshotted from the library, so there is nothing to link to. Link one of its sub-KPIs instead."}
          </p>
        )}

        {alreadyLinked && (
          <p className="text-body-sm text-mute">
            This source already feeds part of this KPI. Linking it again to the same
            target will be rejected — pick a different target or edit the existing
            link from the Data Sources page.
          </p>
        )}

        {dataSourceId > 0 && (
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

            {allowsVariables && mappings.length > 0 && (
              <p className="mt-sm flex items-center gap-xs text-caption-sm text-mute">
                <Badge tone="neutral">tip</Badge>
                A {targetUnit} target is fed as {SLOT_LABELS.variable1} ÷{" "}
                {SLOT_LABELS.variable2}.
              </p>
            )}
          </div>
        )}

        <Field label="Note" hint="Optional — how this data supports the KPI.">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
