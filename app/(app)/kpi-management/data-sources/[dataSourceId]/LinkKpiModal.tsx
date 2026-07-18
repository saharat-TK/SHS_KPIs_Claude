"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Field, Input, Select } from "@/components/ui";
import {
  useCreateDataSourceLink,
  useLibraryKpis,
  useLibraryMetrics,
  useStrategicSets,
} from "@/lib/data/hooks";

/** Link this data source to a library KPI, or to one of that KPI's metrics.
 *  Cascading set → KPI → metric, matching the library's own hierarchy. */
export function LinkKpiModal({
  open,
  onClose,
  dataSourceId,
}: {
  open: boolean;
  onClose: () => void;
  dataSourceId: number;
}) {
  const setsQ = useStrategicSets();
  const [setId, setSetId] = useState(0);
  const [kpiId, setKpiId] = useState(0);
  const [metricId, setMetricId] = useState(0);
  const [note, setNote] = useState("");

  const kpisQ = useLibraryKpis(setId);
  const metricsQ = useLibraryMetrics(kpiId);
  const create = useCreateDataSourceLink();

  useEffect(() => {
    if (!open) {
      setSetId(0);
      setKpiId(0);
      setMetricId(0);
      setNote("");
    }
  }, [open]);

  const valid = kpiId > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Link to a KPI"
      subtitle="Records that this data source is the evidence behind a KPI or one of its metrics. It does not feed progress values — those stay manual."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || create.isPending}
            onClick={() =>
              create.mutate(
                {
                  id: dataSourceId,
                  input: {
                    // A metric link stands on its own; the parent KPI is derived
                    // for display, so send only one of the two ids.
                    ...(metricId > 0
                      ? { libraryMetricId: metricId }
                      : { libraryKpiId: kpiId }),
                    note: note.trim() || undefined,
                  },
                },
                { onSuccess: onClose },
              )
            }
          >
            {create.isPending ? "Linking…" : "Link"}
          </Button>
        </>
      }
    >
      <div className="grid gap-md">
        <Field label="Strategic set">
          <Select
            value={setId || ""}
            onChange={(e) => {
              setSetId(Number(e.target.value));
              setKpiId(0);
              setMetricId(0);
            }}
          >
            <option value="">Select a set…</option>
            {(setsQ.data ?? []).map((s) => (
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
            onChange={(e) => {
              setKpiId(Number(e.target.value));
              setMetricId(0);
            }}
          >
            <option value="">
              {setId ? "Select a KPI…" : "Select a set first"}
            </option>
            {(kpisQ.data ?? []).map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Metric"
          hint="Optional — leave blank to link the KPI itself."
        >
          <Select
            value={metricId || ""}
            disabled={!kpiId || (metricsQ.data ?? []).length === 0}
            onChange={(e) => setMetricId(Number(e.target.value))}
          >
            <option value="">The KPI itself</option>
            {(metricsQ.data ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Note" hint="Optional — how this data supports the KPI.">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
