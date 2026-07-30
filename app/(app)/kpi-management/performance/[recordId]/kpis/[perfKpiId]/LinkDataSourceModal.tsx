"use client";

// The mirror image of LinkKpiModal: there you pick a KPI for a data source,
// here you pick a data source for a KPI (or one of its sub-KPIs). Both build the
// same DataSourceLinkMapping[] through the shared LinkMappingEditor, and both
// POST to /api/data-sources/[id]/links — the data source is the path param and
// the target is the body, so reverse mode varies the path instead of the body.
import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Field, Select } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  useCreateDataSourceLink,
  useDataSourceColumns,
  useDataSourceEntries,
  useDataSources,
  useFacultyRecords,
  useAcademicCatalog,
  useUpdateDataSourceLink,
} from "@/lib/data/hooks";
import { targetAllowsVariables } from "@/lib/kpi/progress";
import { buildCellLabels } from "@/lib/kpi/academicCatalog";
import type { DataSourceLink, PerfKpi, PerfMetric } from "@/lib/types";
import {
  LinkMappingSection,
  toDraft,
  toPayload,
  type DraftMapping,
} from "@/app/(app)/kpi-management/data-sources/[dataSourceId]/LinkMappingEditor";

/** Link a data source to this KPI or one of its sub-KPIs. The target is fixed by
 *  the page; only the source and its mapping are chosen here. Editing keeps both
 *  the source and the target — the unique key is built on them — and changes only
 *  the mappings, exactly as LinkKpiModal's edit mode does. */
export function LinkDataSourceModal({
  open,
  onClose,
  kpi,
  metrics,
  linkedSourceIds,
  link,
}: {
  open: boolean;
  onClose: () => void;
  kpi: PerfKpi;
  metrics: PerfMetric[];
  /** Sources already linked to this KPI — offered but flagged, since a second
   *  link to the same target would collide with uq_ds_link. */
  linkedSourceIds: number[];
  /** Present = edit mode. Carries its own dataSourceId, so editing needs no
   *  other prop to know which source's columns to preview against. */
  link?: DataSourceLink | null;
}) {
  const isEdit = !!link;
  const [dataSourceId, setDataSourceId] = useState(0);
  // "" = the KPI itself; otherwise a perf metric id.
  const [metricId, setMetricId] = useState(0);
  const [note, setNote] = useState("");
  const [mappings, setMappings] = useState<DraftMapping[]>([]);

  const sourcesQ = useDataSources();
  // In edit mode the source is the one the link already belongs to, so the
  // mapping preview reads the right columns without a picker.
  const activeSourceId = link?.dataSourceId ?? dataSourceId;
  const columnsQ = useDataSourceColumns(activeSourceId);
  const entriesQ = useDataSourceEntries(activeSourceId);
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
      setDataSourceId(0);
      setMetricId(0);
    }
  }, [open, link]);

  // The link targets the LIBRARY row this record was snapshotted from, never the
  // perf row. A KPI created straight on a record has no library twin.
  const selectedMetric = metrics.find((m) => m.id === metricId) ?? null;
  const targetLibraryKpiId = kpi.sourceKpiId ?? null;
  const targetLibraryMetricId = selectedMetric?.sourceMetricId ?? null;
  const targetMissing =
    !isEdit && (metricId > 0 ? targetLibraryMetricId == null : targetLibraryKpiId == null);

  // A percent/ratio target can be fed as two variables instead of one value —
  // KPI targets only. Same helper the data-sources modal uses, so the rule is
  // identical whichever direction you link from.
  const targetUnit = (selectedMetric ? selectedMetric.unit : kpi.unit) ?? null;
  const allowsVariables = targetAllowsVariables({
    isMetric: metricId > 0,
    unit: targetUnit,
    isEdit,
  });

  const alreadyLinked =
    !isEdit && dataSourceId > 0 && linkedSourceIds.includes(dataSourceId);
  const submitting = create.isPending || update.isPending;
  const valid = isEdit ? activeSourceId > 0 : dataSourceId > 0 && !targetMissing;

  const submit = () => {
    const payload = mappings.map(toPayload);
    if (isEdit && link) {
      update.mutate(
        {
          dataSourceId: activeSourceId,
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
          ...(metricId > 0
            ? { libraryMetricId: targetLibraryMetricId as number }
            : { libraryKpiId: targetLibraryKpiId as number }),
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
      title={isEdit ? "Edit Link" : "Link a Data Source"}
      subtitle={
        isEdit
          ? `Which rows of “${link?.dataSourceName ?? "this data source"}” produce “${link?.metricName || link?.kpiName}”.`
          : "Pick the source, then say which of its rows count toward this KPI. Leave the mapping empty to record the link as evidence only."
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
        <div className="flex items-start gap-sm rounded-md border border-[#e9c98a] bg-[#fbeed6] px-md py-sm text-caption-sm text-[#8a4b00]">
          <Icon name="warning" className="mt-tiny shrink-0 text-[16px]" />
          <span>
            A link belongs to the KPI itself, not to this performance record. It
            applies everywhere the KPI appears, and its values are recomputed for
            every active record as soon as you save.
          </span>
        </div>

        {isEdit ? (
          // Both the source and the target are part of the link's unique key, so
          // editing can only change the mappings — state them instead of
          // offering pickers that would have nothing to do.
          <div className="rounded-md border border-hairline bg-surface-lowest px-md py-sm text-body-sm">
            <span className="text-mute">Feeding </span>
            <span className="font-medium">{link?.metricName || link?.kpiName}</span>
            {link?.dataSourceName && (
              <>
                <span className="text-mute"> from </span>
                <span className="font-medium">{link.dataSourceName}</span>
              </>
            )}
          </div>
        ) : (
          <>
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
              <Select
                value={metricId || ""}
                onChange={(e) => setMetricId(Number(e.target.value))}
              >
                <option value="">This KPI ({kpi.name})</option>
                {metrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

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
            target will be rejected — pick a different target, or edit the existing
            link from the Linked Data Sources list.
          </p>
        )}

        <LinkMappingSection
          mappings={mappings}
          onChange={setMappings}
          columns={columns}
          entries={entries}
          labels={labels}
          faculty={facultyQ.data ?? []}
          allowsVariables={allowsVariables}
          targetUnit={targetUnit}
          note={note}
          onNote={setNote}
          placeholder={
            activeSourceId > 0
              ? undefined
              : "Pick a data source above to choose which of its rows count."
          }
        />
      </div>
    </Modal>
  );
}
