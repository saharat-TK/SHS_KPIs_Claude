"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Button,
  Badge,
  Tabs,
  StatusPill,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import {
  usePerformanceRecords,
  useCommitteeMemberships,
  useRecordApprovals,
  useKpiApproval,
  useApprovalTransition,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ACTION_LABELS,
  actionRequiresComment,
  availableActions,
  resolvePositionFromMemberships,
  resolveStageRole,
} from "@/lib/kpi/approvalWorkflow";
import type { ApprovalAction, ApprovalState, PerfKpiApproval, StageRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATE_TABS: { id: ApprovalState | "all"; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "returned", label: "Returned" },
  { id: "forwarded", label: "Forwarded" },
  { id: "approved", label: "Approved" },
  { id: "all", label: "All" },
];

const ACTION_ICONS: Record<ApprovalAction, string> = {
  submit: "send",
  return: "undo",
  forward: "forward",
  approve: "check",
  reject: "close",
  reverse: "lock_open",
};

const ACTION_TONE: Partial<Record<ApprovalAction, string>> = {
  approve: "text-success",
  reject: "text-error",
  return: "text-error",
};

export default function ValidationPage() {
  return (
    <RequirePermission action="record_performance">
      <PerformanceApprovalQueue />
    </RequirePermission>
  );
}

function PerformanceApprovalQueue() {
  const { user } = useAuth();
  const records = usePerformanceRecords();
  const memberships = useCommitteeMemberships();
  const [recordId, setRecordId] = useState(0);
  const [yearNo, setYearNo] = useState(1);
  const [quarterNo, setQuarterNo] = useState(1);
  const [tab, setTab] = useState<ApprovalState | "all">("all");
  const [actOn, setActOn] = useState<{ row: PerfKpiApproval; action: ApprovalAction } | null>(null);
  const [detail, setDetail] = useState<PerfKpiApproval | null>(null);

  // The active record is the current working set; older records remain available
  // for reviewing history and audit evidence.
  const selectedRecord = records.data?.find((record) => record.id === recordId);
  const activeRecord = records.data?.find((record) => record.status === "active");
  const defaultRecord = activeRecord ?? records.data?.[0];
  const record = selectedRecord ?? defaultRecord;
  useEffect(() => {
    if (!recordId && defaultRecord) {
      setRecordId(defaultRecord.id);
    }
  }, [defaultRecord, recordId]);

  const approvals = useRecordApprovals(record?.id ?? 0, yearNo, quarterNo);
  const transition = useApprovalTransition(record?.id ?? 0);
  const stageRoleFor = (committeeId: string | null): StageRole | null => {
    const position = resolvePositionFromMemberships(memberships.data, user.facultyId, committeeId);
    return resolveStageRole(position, user.role);
  };
  const runAction = (row: PerfKpiApproval, action: ApprovalAction, comment?: string) =>
    transition.mutate({
      perfKpiId: row.perfKpiId,
      input: {
        action,
        yearNo,
        quarterNo,
        actorId: user.facultyId,
        actorName: user.name,
        userRole: user.role,
        comment,
      },
    });

  const counts = useMemo(() => {
    const result: Partial<Record<ApprovalState, number>> = {};
    for (const approval of approvals.data ?? []) {
      result[approval.state] = (result[approval.state] ?? 0) + 1;
    }
    return result;
  }, [approvals.data]);
  const tabs = STATE_TABS.map((item) => ({
    ...item,
    count: item.id === "all" ? approvals.data?.length ?? 0 : counts[item.id] ?? 0,
  }));
  const rows = useMemo(() => {
    const list = approvals.data ?? [];
    return tab === "all" ? list : list.filter((approval) => approval.state === tab);
  }, [approvals.data, tab]);
  const yearLabel = (value: number) =>
    record ? `${record.startYear + value - 1} (Y${value})` : `Y${value}`;

  return (
    <>
      <PageHeader
        title="Performance Approval Queue"
        description="Review each quarterly KPI package and its metrics through committee, lead, and final approval."
      />

      <Card className="mb-md">
        <div className="flex flex-wrap items-end gap-md p-md">
          <div className="min-w-[280px]">
            <Field label="Performance record">
              <Select value={String(record?.id ?? "")} onChange={(event) => setRecordId(Number(event.target.value))}>
                {(records.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}{item.status === "active" ? " (Active)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Year">
            <Select value={String(yearNo)} onChange={(event) => setYearNo(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{yearLabel(value)}</option>)}
            </Select>
          </Field>
          <Field label="Quarter">
            <Select value={String(quarterNo)} onChange={(event) => setQuarterNo(Number(event.target.value))}>
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>Q{value}</option>)}
            </Select>
          </Field>
        </div>
      </Card>

      <Tabs items={tabs} active={tab} onChange={(value) => setTab(value as ApprovalState | "all")} />

      <Card className="overflow-hidden">
        <QueryBoundary isLoading={records.isLoading || approvals.isLoading} isError={approvals.isError}>
          {rows.length === 0 ? (
            <EmptyState icon="task_alt" title="Nothing here" message="No KPI packages match the selected record, period, and status." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>KPI package</Th>
                  <Th>Committee</Th>
                  <Th align="right">KPI value</Th>
                  <Th align="right">Metrics</Th>
                  <Th>Period</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const actions = availableActions(stageRoleFor(row.committeeId), row.state);
                  return (
                    <Tr key={row.perfKpiId} onClick={() => setDetail(row)}>
                      <Td className="font-medium">{row.kpiName}</Td>
                      <Td className="text-mute">{row.committeeName ?? row.committeeId}</Td>
                      <Td align="right" className="font-medium">{row.progressValue ?? "—"} {row.unit ?? ""}</Td>
                      <Td align="right"><Badge tone="neutral">{row.metrics?.length ?? 0}</Badge></Td>
                      <Td className="text-mute">{yearLabel(yearNo)} · Q{quarterNo}</Td>
                      <Td><StatusPill status={row.state} kind="approval" /></Td>
                      <Td align="right" onClick={(event) => event.stopPropagation()}>
                        {actions.length === 0 ? (
                          <span className="text-caption-sm text-mute">{row.state === "approved" ? "Locked" : "—"}</span>
                        ) : (
                          <div className="flex items-center justify-end gap-xs">
                            {actions.map((action) => (
                              <Button key={action} size="sm" variant="ghost" icon={ACTION_ICONS[action]} className={ACTION_TONE[action]} disabled={transition.isPending}
                                onClick={() => actionRequiresComment(action) ? setActOn({ row, action }) : runAction(row, action)}>
                                {ACTION_LABELS[action]}
                              </Button>
                            ))}
                          </div>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      {actOn && (
        <NoteModal
          action={actOn.action}
          kpiName={actOn.row.kpiName ?? "KPI"}
          submitting={transition.isPending}
          onClose={() => setActOn(null)}
          onSend={(comment) => { runAction(actOn.row, actOn.action, comment); setActOn(null); }}
        />
      )}
      {detail && <ApprovalDetail row={detail} yearLabel={yearLabel(yearNo)} quarterNo={quarterNo} onClose={() => setDetail(null)} />}
    </>
  );
}

function ApprovalDetail({ row, yearLabel, quarterNo, onClose }: { row: PerfKpiApproval; yearLabel: string; quarterNo: number; onClose: () => void }) {
  const approvalQ = useKpiApproval(row.perfKpiId, row.yearNo, row.quarterNo);
  const approval = approvalQ.data?.approval ?? row;
  return (
    <Modal open onClose={onClose} title={row.kpiName ?? "KPI package"} subtitle={`${row.committeeName ?? row.committeeId ?? ""} · ${yearLabel} Q${quarterNo}`} size="lg">
      <div className="flex flex-col gap-lg">
        <div className="flex flex-wrap items-center gap-md">
          <Badge tone="neutral">KPI value: {row.progressValue ?? "—"} {row.unit ?? ""}</Badge>
          <StatusPill status={approval.state} kind="approval" />
          {approval.state === "approved" && <span className="inline-flex items-center gap-xs text-caption-sm text-mute"><Icon name="lock" size={16} /> Locked after final approval</span>}
        </div>
        <div>
          <p className="mb-sm text-label-md text-on-surface">Metrics included in this approval package</p>
          {row.metrics?.length ? (
            <Table>
              <thead><tr><Th>Metric</Th><Th align="right">Q{quarterNo} value</Th></tr></thead>
              <tbody>{row.metrics.map((metric) => <Tr key={metric.id}><Td className="font-medium">{metric.name}</Td><Td align="right">{metric.progressValue ?? "—"} {metric.unit ?? ""}</Td></Tr>)}</tbody>
            </Table>
          ) : <p className="text-body-sm text-mute">This KPI has no sub-metrics; its direct quarterly value is the submitted evidence.</p>}
        </div>
        <div className="flex flex-col gap-sm">
          <p className="text-label-md text-on-surface">Approval history</p>
          <QueryBoundary isLoading={approvalQ.isLoading} isError={approvalQ.isError}>
            {(approvalQ.data?.events ?? []).length === 0 ? <p className="text-body-sm text-mute">Not yet submitted.</p> : approvalQ.data!.events.map((event) => (
              <div key={event.id} className="rounded-lg border border-hairline bg-surface-soft p-md">
                <div className="flex items-center gap-sm"><Icon name="account_circle" size={18} className="text-mute" /><span className="text-label-md">{event.actorName ?? "—"}</span><Badge tone="neutral">{ACTION_LABELS[event.action]}</Badge><span className="ml-auto text-caption-sm text-mute">{formatDate(event.createdAt)}</span></div>
                <p className="mt-xs text-caption-sm text-mute">{event.fromState ?? "draft"} → {event.toState}</p>
                {event.comment && <p className="mt-xs text-body-sm">{event.comment}</p>}
              </div>
            ))}
          </QueryBoundary>
        </div>
      </div>
    </Modal>
  );
}

function NoteModal({ action, kpiName, submitting, onClose, onSend }: { action: ApprovalAction; kpiName: string; submitting: boolean; onClose: () => void; onSend: (comment: string) => void }) {
  const [comment, setComment] = useState("");
  const hint = action === "return" ? "The package returns to the committee member for revision." : "The package returns to the committee lead for review.";
  return (
    <Modal open onClose={onClose} title={ACTION_LABELS[action]} subtitle={kpiName} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button icon="send" disabled={comment.trim().length < 3 || submitting} onClick={() => onSend(comment.trim())}>{ACTION_LABELS[action]}</Button></>}>
      <Field label="Note to recipient" hint={hint}><Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What needs to change?" autoFocus /></Field>
    </Modal>
  );
}
