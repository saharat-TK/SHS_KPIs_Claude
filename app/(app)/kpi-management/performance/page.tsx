"use client";

import { useEffect, useRef, useState } from "react";
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
  usePerformancePeriods,
  useSavePerformancePeriods,
  useStrategicSets,
  useUpdatePerformanceRecord,
} from "@/lib/data/hooks";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/utils";
import type {
  PerformancePeriod,
  PerformanceRecord,
  PerformanceStatus,
  StrategicSet,
} from "@/lib/types";

const STATUS_TONE: Record<PerformanceStatus, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  completed: "warning",
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
  const updateRecord = useUpdatePerformanceRecord();
  const [showActivate, setShowActivate] = useState(false);
  const [periodRecord, setPeriodRecord] = useState<PerformanceRecord | null>(null);
  const [statusChange, setStatusChange] = useState<{
    record: PerformanceRecord;
    status: PerformanceStatus;
  } | null>(null);

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
                  <Th align="center">Open Periods</Th>
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
                    <Td align="center">
                      <Badge tone={(r.openPeriodCount ?? 0) > 0 ? "success" : "neutral"}>
                        {r.openPeriodCount ?? 0} / 20 open
                      </Badge>
                    </Td>
                    <Td align="center" className="text-mute">
                      {r.activatedAt ? formatDate(r.activatedAt) : "—"}
                    </Td>
                    <Td align="right">
                      <RecordActions
                        record={r}
                        isAdmin={isAdmin}
                        onOpen={() => router.push(`/kpi-management/performance/${r.id}`)}
                        onPeriods={() => setPeriodRecord(r)}
                        onSetStatus={(status) => setStatusChange({ record: r, status })}
                      />
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

      {periodRecord && (
        <RecordingPeriodsModal
          record={periodRecord}
          onClose={() => setPeriodRecord(null)}
        />
      )}

      {statusChange && (
        <StatusConfirmModal
          record={statusChange.record}
          status={statusChange.status}
          submitting={updateRecord.isPending}
          onClose={() => setStatusChange(null)}
          onConfirm={() =>
            updateRecord.mutate(
              { id: statusChange.record.id, patch: { status: statusChange.status } },
              { onSuccess: () => setStatusChange(null) },
            )
          }
        />
      )}
    </>
  );
}

function RecordActions({
  record,
  isAdmin,
  onOpen,
  onPeriods,
  onSetStatus,
}: {
  record: PerformanceRecord;
  isAdmin: boolean;
  onOpen: () => void;
  onPeriods: () => void;
  onSetStatus: (status: PerformanceStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const toggleMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Reserve space for the expanded status choices so the fixed menu opens
    // upward when it would otherwise run beyond the viewport.
    const menuHeight = isAdmin ? 250 : 48;
    const gap = 4;
    const top =
      rect.bottom + gap + menuHeight > window.innerHeight
        ? Math.max(gap, rect.top - menuHeight - gap)
        : rect.bottom + gap;
    setMenuPosition({ top, right: window.innerWidth - rect.right });
    setOpen((wasOpen) => {
      if (wasOpen) setStatusOpen(false);
      return !wasOpen;
    });
  };

  return (
    <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${record.name}`}
        title="Actions"
        className="rounded p-xs text-mute hover:bg-surface-soft hover:text-on-surface"
        onClick={toggleMenu}
      >
        <Icon name="more_vert" size={20} />
      </button>
      {open && menuPosition && (
        <div
          className="fixed z-[200] min-w-[180px] overflow-hidden rounded border border-hairline bg-surface-lowest shadow-chrome"
          style={{ top: menuPosition.top, right: menuPosition.right }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-sm px-md py-sm text-left text-body-sm hover:bg-surface-soft"
            onClick={() => {
              setOpen(false);
              setStatusOpen(false);
              onOpen();
            }}
          >
            <Icon name="open_in_new" size={18} />
            Open record
          </button>
          {isAdmin && (
            <button
              type="button"
              className="flex w-full items-center gap-sm px-md py-sm text-left text-body-sm hover:bg-surface-soft"
              onClick={() => {
              setOpen(false);
              setStatusOpen(false);
              onPeriods();
              }}
            >
              <Icon name="event_available" size={18} />
              Recording periods
            </button>
          )}
          {isAdmin && (
            <div className="border-t border-hairline">
              <button
                type="button"
                aria-expanded={statusOpen}
                className="flex w-full items-center justify-between gap-sm px-md py-sm text-left text-body-sm hover:bg-surface-soft"
                onClick={() => setStatusOpen((value) => !value)}
              >
                <span className="inline-flex items-center gap-sm">
                  <Icon name="change_circle" size={18} />
                  Set status
                </span>
                <Icon name={statusOpen ? "expand_less" : "expand_more"} size={18} />
              </button>
              {statusOpen && (
                <div className="border-t border-hairline bg-surface-soft py-xs">
                  {(["active", "inactive", "completed"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={status === record.status}
                      className="flex w-full items-center justify-between gap-sm px-lg py-sm text-left text-body-sm hover:bg-surface-container-high disabled:cursor-default disabled:text-mute"
                      onClick={() => {
                        setOpen(false);
                        setStatusOpen(false);
                        onSetStatus(status);
                      }}
                    >
                      <span className="capitalize">{status}</span>
                      {status === record.status && <Icon name="check" size={18} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusConfirmModal({
  record,
  status,
  submitting,
  onClose,
  onConfirm,
}: {
  record: PerformanceRecord;
  status: PerformanceStatus;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Change record status"
      subtitle={record.name}
      size="md"
      footer={
        <>
          <Button variant="ghost" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button icon="check" disabled={submitting} onClick={onConfirm}>
            {submitting ? "Saving…" : `Set ${status}`}
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-mute">
        Set this record to <span className="font-medium capitalize text-on-surface">{status}</span>?
        {status !== "active" && " Progress entry, syncing, and data-source updates will be paused until it is reactivated."}
      </p>
    </Modal>
  );
}

function RecordingPeriodsModal({
  record,
  onClose,
}: {
  record: PerformanceRecord;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const periodsQ = usePerformancePeriods(record.id);
  const save = useSavePerformancePeriods();
  const [draft, setDraft] = useState<Pick<PerformancePeriod, "yearNo" | "quarterNo" | "isOpen">[]>([]);

  useEffect(() => {
    if (periodsQ.data) {
      setDraft(
        periodsQ.data.map((p) => ({
          yearNo: p.yearNo,
          quarterNo: p.quarterNo,
          isOpen: p.isOpen,
        })),
      );
    }
  }, [periodsQ.data]);

  const periodFor = (yearNo: number, quarterNo: number) =>
    draft.find((p) => p.yearNo === yearNo && p.quarterNo === quarterNo);

  // Audit metadata (opened/updated by + timestamps) lives on the loaded query,
  // not the editable draft — it reflects what's currently persisted.
  const auditFor = (yearNo: number, quarterNo: number) =>
    periodsQ.data?.find((p) => p.yearNo === yearNo && p.quarterNo === quarterNo);

  const auditText = (yearNo: number, quarterNo: number): string | undefined => {
    const p = auditFor(yearNo, quarterNo);
    if (!p) return undefined;
    const parts: string[] = [];
    if (p.isOpen && p.openedBy) {
      parts.push(`Opened by ${p.openedBy}${p.openedAt ? ` on ${formatDate(p.openedAt)}` : ""}`);
    }
    if (p.updatedBy) {
      parts.push(`Updated by ${p.updatedBy}${p.updatedAt ? ` on ${formatDate(p.updatedAt)}` : ""}`);
    }
    return parts.length ? parts.join(" · ") : undefined;
  };

  const yearAuditText = (yearNo: number): string | null => {
    const rows = (periodsQ.data ?? []).filter((p) => p.yearNo === yearNo && p.updatedAt);
    if (rows.length === 0) return null;
    const latest = rows.reduce((a, b) =>
      String(a.updatedAt) >= String(b.updatedAt) ? a : b,
    );
    if (!latest.updatedAt) return null;
    return `Last changed: Q${latest.quarterNo}${
      latest.updatedBy ? ` by ${latest.updatedBy}` : ""
    } · ${formatDate(latest.updatedAt)}`;
  };

  const setQuarter = (yearNo: number, quarterNo: number, isOpen: boolean) =>
    setDraft((items) =>
      items.map((p) => (p.yearNo === yearNo && p.quarterNo === quarterNo ? { ...p, isOpen } : p)),
    );

  const setYear = (yearNo: number, isOpen: boolean) =>
    setDraft((items) => items.map((p) => (p.yearNo === yearNo ? { ...p, isOpen } : p)));

  return (
    <Modal
      open
      onClose={onClose}
      title="Recording Periods"
      subtitle={`${record.name} · ${record.startYear}–${record.endYear}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon="save"
            disabled={periodsQ.isLoading || save.isPending || draft.length !== 20}
            onClick={() =>
              save.mutate(
                { id: record.id, periods: draft, updatedBy: user?.email },
                { onSuccess: onClose },
              )
            }
          >
            {save.isPending ? "Saving…" : "Save Periods"}
          </Button>
        </>
      }
    >
      <QueryBoundary isLoading={periodsQ.isLoading} isError={periodsQ.isError}>
        <div className="flex flex-col gap-md">
          {[1, 2, 3, 4, 5].map((yearNo) => {
            const quarters = [1, 2, 3, 4].map((quarterNo) => periodFor(yearNo, quarterNo));
            const allOpen = quarters.every((p) => p?.isOpen);
            return (
              <div
                key={yearNo}
                className="grid grid-cols-1 gap-md rounded border border-hairline bg-surface-lowest p-md sm:grid-cols-[150px_120px_1fr]"
              >
                <div>
                  <div className="text-label-md text-on-surface">Year {yearNo}</div>
                  <div className="text-caption-sm text-mute">{record.startYear + yearNo - 1}</div>
                </div>
                <Button
                  variant={allOpen ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => setYear(yearNo, !allOpen)}
                >
                  {allOpen ? "Close Year" : "Open Year"}
                </Button>
                <div className="flex flex-col gap-xs">
                  <div className="grid grid-cols-2 gap-sm sm:grid-cols-4">
                    {[1, 2, 3, 4].map((quarterNo) => {
                      const period = periodFor(yearNo, quarterNo);
                      const isOpen = !!period?.isOpen;
                      return (
                        <button
                          key={quarterNo}
                          type="button"
                          title={auditText(yearNo, quarterNo)}
                          className={[
                            "flex h-[34px] items-center justify-center rounded-DEFAULT border px-sm text-label-md transition-colors",
                            isOpen
                              ? "border-primary-container bg-primary text-on-primary"
                              : "border-hairline bg-surface-soft text-mute hover:text-on-surface",
                          ].join(" ")}
                          onClick={() => setQuarter(yearNo, quarterNo, !isOpen)}
                        >
                          Q{quarterNo} {isOpen ? "Open" : "Closed"}
                        </button>
                      );
                    })}
                  </div>
                  {yearAuditText(yearNo) && (
                    <div className="text-caption-sm text-stone">{yearAuditText(yearNo)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </QueryBoundary>
    </Modal>
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
