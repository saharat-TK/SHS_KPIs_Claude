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
  availableActions,
  resolveStageRole,
  actionRequiresComment,
  ACTION_LABELS,
} from "@/lib/kpi/approvalWorkflow";
import type {
  ApprovalAction,
  ApprovalState,
  PerfKpiApproval,
  StageRole,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function PerformanceApprovalsPage() {
  return (
    <RequirePermission action="record_performance">
      <ApprovalQueue />
    </RequirePermission>
  );
}

const STATE_TABS: { id: string; label: string }[] = [
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

function ApprovalQueue() {
  const { user } = useAuth();
  const records = usePerformanceRecords();
  const memberships = useCommitteeMemberships();

  const [recordId, setRecordId] = useState(0);
  const [yearNo, setYearNo] = useState(1);
  const [quarterNo, setQuarterNo] = useState(1);
  const [tab, setTab] = useState("submitted");
  const [actOn, setActOn] = useState<{ row: PerfKpiApproval; action: ApprovalAction } | null>(null);
  const [detail, setDetail] = useState<PerfKpiApproval | null>(null);

  // Default to the first record once loaded.
  const activeRecord = records.data?.find((r) => r.id === recordId) ?? records.data?.[0];
  useEffect(() => {
    if (!recordId && records.data?.length) setRecordId(records.data[0].id);
  }, [recordId, records.data]);

  const approvals = useRecordApprovals(activeRecord?.id ?? 0, yearNo, quarterNo);
  const transition = useApprovalTransition(activeRecord?.id ?? 0);

  // Resolve the acting persona's stage role for a given KPI's committee.
  const stageRoleFor = (committeeId: string | null): StageRole | null => {
    if (user.role === "admin") return "admin";
    const position = memberships.data?.find(
      (m) => m.facultyId === user.facultyId && m.committeeId === committeeId,
    )?.position;
    return resolveStageRole(position, user.role);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of approvals.data ?? []) c[a.state] = (c[a.state] ?? 0) + 1;
    return c;
  }, [approvals.data]);

  const tabs = STATE_TABS.map((t) => ({
    ...t,
    count: t.id === "all" ? approvals.data?.length : counts[t.id] ?? 0,
  }));

  const rows = useMemo(() => {
    const list = approvals.data ?? [];
    return tab === "all" ? list : list.filter((a) => a.state === tab);
  }, [approvals.data, tab]);

  const yearLabel = (yn: number) =>
    activeRecord ? `${activeRecord.startYear + yn - 1} (Y${yn})` : `Y${yn}`;

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

  return (
    <>
      <PageHeader
        title="Performance Approvals"
        description="Committee members submit recorded KPI performance for the committee lead, who forwards it to the counselor for final approval. Approved records are locked."
      />

      {/* Record + period selectors */}
      <Card className="mb-md">
        <div className="flex flex-wrap items-end gap-md p-md">
          <div className="min-w-[280px]">
            <Field label="Performance record">
              <Select
                value={String(activeRecord?.id ?? "")}
                onChange={(e) => setRecordId(Number(e.target.value))}
              >
                {(records.data ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Year">
            <Select value={String(yearNo)} onChange={(e) => setYearNo(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((yn) => (
                <option key={yn} value={yn}>
                  {yearLabel(yn)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quarter">
            <Select value={String(quarterNo)} onChange={(e) => setQuarterNo(Number(e.target.value))}>
              {[1, 2, 3, 4].map((qn) => (
                <option key={qn} value={qn}>
                  Q{qn}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Tabs items={tabs} active={tab} onChange={setTab} />

      <Card className="overflow-hidden">
        <QueryBoundary
          isLoading={records.isLoading || approvals.isLoading}
          isError={approvals.isError}
        >
          {rows.length === 0 ? (
            <EmptyState icon="task_alt" title="Nothing here" message="No KPIs in this state for the selected period." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>KPI</Th>
                  <Th>Committee</Th>
                  <Th align="right">Value</Th>
                  <Th>Period</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const stageRole = stageRoleFor(row.committeeId);
                  const actions = availableActions(stageRole, row.state as ApprovalState);
                  return (
                    <Tr key={row.perfKpiId} onClick={() => setDetail(row)}>
                      <Td className="font-medium">{row.kpiName}</Td>
                      <Td className="text-mute">{row.committeeName ?? row.committeeId}</Td>
                      <Td align="right" className="font-medium">
                        {row.progressValue ?? "—"} {row.unit ?? ""}
                      </Td>
                      <Td className="text-mute">
                        {yearLabel(yearNo)} · Q{quarterNo}
                      </Td>
                      <Td>
                        <StatusPill status={row.state as ApprovalState} kind="approval" />
                      </Td>
                      <Td align="right" onClick={(e) => e.stopPropagation()}>
                        {actions.length === 0 ? (
                          <span className="text-caption-sm text-mute">
                            {row.state === "approved" ? "Locked" : "—"}
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-xs">
                            {actions.map((action) => (
                              <Button
                                key={action}
                                size="sm"
                                variant="ghost"
                                icon={ACTION_ICONS[action]}
                                className={ACTION_TONE[action]}
                                disabled={transition.isPending}
                                onClick={() =>
                                  actionRequiresComment(action)
                                    ? setActOn({ row, action })
                                    : runAction(row, action)
                                }
                              >
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

      {/* Note-required action (send back / reject) */}
      {actOn && (
        <NoteModal
          title={ACTION_LABELS[actOn.action]}
          subtitle={actOn.row.kpiName ?? ""}
          hint={
            actOn.action === "return"
              ? "The submission moves to 'Returned' for the committee member to revise."
              : "The submission moves back to 'Submitted' for the committee lead."
          }
          submitting={transition.isPending}
          onClose={() => setActOn(null)}
          onSend={(text) => {
            runAction(actOn.row, actOn.action, text);
            setActOn(null);
          }}
        />
      )}

      {/* Detail + audit thread */}
      {detail && activeRecord && (
        <DetailModal
          row={detail}
          yearLabel={yearLabel(yearNo)}
          quarterNo={quarterNo}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}

function DetailModal({
  row,
  yearLabel,
  quarterNo,
  onClose,
}: {
  row: PerfKpiApproval;
  yearLabel: string;
  quarterNo: number;
  onClose: () => void;
}) {
  const q = useKpiApproval(row.perfKpiId, row.yearNo, row.quarterNo);
  const events = q.data?.events ?? [];
  return (
    <Modal
      open
      onClose={onClose}
      title={row.kpiName ?? "KPI"}
      subtitle={`${row.committeeName ?? row.committeeId ?? ""} · ${yearLabel} Q${quarterNo}`}
      size="lg"
    >
      <div className="flex flex-col gap-lg">
        <div className="flex flex-wrap items-center gap-md">
          <Badge tone="neutral">
            Value: {row.progressValue ?? "—"} {row.unit ?? ""}
          </Badge>
          <StatusPill status={row.state as ApprovalState} kind="approval" />
          {row.state === "approved" && (
            <span className="inline-flex items-center gap-xs text-caption-sm text-mute">
              <Icon name="lock" size={16} /> Locked after final approval
            </span>
          )}
        </div>
        <div className="flex flex-col gap-sm">
          <p className="text-label-md text-on-surface">Approval history</p>
          <QueryBoundary isLoading={q.isLoading} isError={q.isError}>
            {events.length === 0 ? (
              <p className="text-body-sm text-mute">Not yet submitted.</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="rounded-lg border border-hairline bg-surface-soft p-md">
                  <div className="flex items-center gap-sm">
                    <Icon name="account_circle" size={18} className="text-mute" />
                    <span className="text-label-md">{e.actorName ?? "—"}</span>
                    <Badge tone="neutral">{ACTION_LABELS[e.action] ?? e.action}</Badge>
                    {e.actorRole && (
                      <span className="text-caption-sm text-mute">{e.actorRole}</span>
                    )}
                    <span className="ml-auto text-caption-sm text-mute">{formatDate(e.createdAt)}</span>
                  </div>
                  <p className="mt-xs text-caption-sm text-mute">
                    {e.fromState ?? "draft"} → {e.toState}
                  </p>
                  {e.comment && <p className="mt-xs text-body-sm">{e.comment}</p>}
                </div>
              ))
            )}
          </QueryBoundary>
        </div>
      </div>
    </Modal>
  );
}

function NoteModal({
  title,
  subtitle,
  hint,
  onClose,
  onSend,
  submitting,
}: {
  title: string;
  subtitle: string;
  hint: string;
  onClose: () => void;
  onSend: (text: string) => void;
  submitting: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon="send"
            disabled={text.trim().length < 3 || submitting}
            onClick={() => onSend(text.trim())}
          >
            {title}
          </Button>
        </>
      }
    >
      <Field label="Note to recipient" hint={hint}>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to change?"
          autoFocus
        />
      </Field>
    </Modal>
  );
}
