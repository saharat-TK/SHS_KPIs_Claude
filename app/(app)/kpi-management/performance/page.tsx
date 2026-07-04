"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Button,
  Badge,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  usePerformanceRecords,
  useActivatePerformanceRecord,
  useStrategicSets,
} from "@/lib/data/hooks";
import { formatDate } from "@/lib/utils";
import type { PerformanceRecord, PerformanceStatus, StrategicSet } from "@/lib/types";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  closed: "neutral",
  archived: "warning",
};

export default function PerformancePage() {
  return (
    <RequirePermission action="view_dashboards">
      <Performance />
    </RequirePermission>
  );
}

function Performance() {
  const router = useRouter();
  const { can } = useAuth();
  const recordsQ = usePerformanceRecords();
  const setsQ = useStrategicSets();
  const activate = useActivatePerformanceRecord();
  const [showActivate, setShowActivate] = useState(false);

  const records = recordsQ.data ?? [];
  const isAdmin = can("configure_kpis");

  return (
    <>
      <PageHeader
        title="Performance Records"
        description="Activated snapshots of a strategic set, used for quarterly progress tracking."
        actions={
          isAdmin ? (
            <Button icon="add" onClick={() => setShowActivate(true)}>
              Activate Record
            </Button>
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        <QueryBoundary isLoading={recordsQ.isLoading} isError={recordsQ.isError}>
          {records.length === 0 ? (
            <EmptyState
              icon="assessment"
              title="No performance records yet"
              message="Activate a strategic set from the KPIs Library to begin recording quarterly performance."
              action={
                isAdmin ? (
                  <Button icon="add" onClick={() => setShowActivate(true)}>
                    Activate Record
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Record Name</Th>
                  <Th align="center">Years</Th>
                  <Th align="center">Status</Th>
                  <Th align="center">KPIs</Th>
                  <Th align="center">Activated</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <Tr
                    key={r.id}
                    onClick={() => router.push(`/kpi-management/performance/${r.id}`)}
                  >
                    <Td className="font-medium">{r.name}</Td>
                    <Td align="center">
                      {r.startYear}–{r.endYear}
                    </Td>
                    <Td align="center">
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    </Td>
                    <Td align="center">{r.kpiCount ?? 0}</Td>
                    <Td align="center" className="text-mute">
                      {r.activatedAt ? formatDate(r.activatedAt) : "—"}
                    </Td>
                    <Td align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconRight="chevron_right"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/kpi-management/performance/${r.id}`);
                        }}
                      >
                        Open
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      <ActivateModal
        open={showActivate}
        sets={setsQ.data ?? []}
        submitting={activate.isPending}
        onClose={() => setShowActivate(false)}
        onActivate={(input) =>
          activate.mutate(input, {
            onSuccess: (rec) => {
              setShowActivate(false);
              router.push(`/kpi-management/performance/${(rec as PerformanceRecord).id}`);
            },
          })
        }
      />
    </>
  );
}

function ActivateModal({
  open,
  onClose,
  onActivate,
  sets,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onActivate: (input: { sourceSetId: number; name?: string; activatedBy?: string }) => void;
  sets: StrategicSet[];
  submitting: boolean;
}) {
  const { user } = useAuth();
  const [sourceSetId, setSourceSetId] = useState<string>("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setSourceSetId(sets[0] ? String(sets[0].id) : "");
      setName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const valid = sourceSetId !== "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Activate Performance Record"
      subtitle="Snapshots the chosen set's KPIs and metrics for quarterly data entry."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() =>
              onActivate({
                sourceSetId: Number(sourceSetId),
                name: name.trim() || undefined,
                activatedBy: user?.email,
              })
            }
          >
            {submitting ? "Activating…" : "Activate"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        {sets.length === 0 ? (
          <p className="text-body-sm text-mute">
            No strategic sets exist yet — create one in the KPIs Library first.
          </p>
        ) : (
          <>
            <Field label="Strategic set">
              <Select value={sourceSetId} onChange={(e) => setSourceSetId(e.target.value)}>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startYear}–{s.endYear})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Record name" hint="Optional — defaults to the set name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2568 Performance Tracking"
              />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}
