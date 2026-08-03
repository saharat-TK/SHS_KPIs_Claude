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
  Tabs,
  StatusPill,
  QueryBoundary,
  EmptyState,
  Modal,
  Drawer,
  Field,
  Input,
  Select,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import { ApprovalDetailPanel, ApprovalPanelStatus } from "./ApprovalDetailPanel";
import {
  usePerformanceRecords,
  useCommitteeMemberships,
  useFacultyRecords,
  useRecordApprovals,
  useApprovalTransition,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  availableActions,
  resolvePositionFromMemberships,
  resolveStageRoles,
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
  const faculty = useFacultyRecords();

  const [recordId, setRecordId] = useState(0);
  const [yearNo, setYearNo] = useState(1);
  const [quarterNo, setQuarterNo] = useState(1);
  const [tab, setTab] = useState("all");
  // Both hold ids, not row objects: acting from the panel changes a row's
  // state, and a captured object would keep offering the pre-transition
  // actions. Same pattern as editingMetricId on the KPI detail page.
  const [actOn, setActOn] = useState<{ perfKpiId: number; action: ApprovalAction } | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  // Default to the first record once loaded.
  const activeRecord = records.data?.find((r) => r.id === recordId) ?? records.data?.[0];
  useEffect(() => {
    if (!recordId && records.data?.length) setRecordId(records.data[0].id);
  }, [recordId, records.data]);

  const approvals = useRecordApprovals(activeRecord?.id ?? 0, yearNo, quarterNo);
  const transition = useApprovalTransition(activeRecord?.id ?? 0);

  // Admin authority comes from faculty.system_role, exactly as the server
  // resolves it — not from the demo persona's coarse app role. A person can
  // be a real committee lead *and* a real admin (e.g. fac-022), and the
  // reverse button must appear for them precisely when the server would
  // actually grant reverse.
  const isSystemAdmin = faculty.data?.find((f) => f.id === user.facultyId)?.systemRole === "admin";

  // Resolve every stage the acting persona may act as for a KPI's committee.
  // Admin is additive, matching the server: an administrator who also sits on
  // the committee keeps their position's actions and gains reverse.
  const stageRolesFor = (committeeId: string | null): StageRole[] => {
    const position = resolvePositionFromMemberships(
      memberships.data,
      user.facultyId,
      committeeId,
    );
    return resolveStageRoles(position, isSystemAdmin);
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

  // Re-derived every render so the panel reflects the current state after a
  // transition. Resolved against the unfiltered list, not `rows` — otherwise
  // forwarding from the panel while the Submitted tab is active would drop the
  // row out of `rows` and the drawer would vanish mid-use.
  const detail = approvals.data?.find((r) => r.perfKpiId === detailId) ?? null;
  const actOnRow = approvals.data?.find((r) => r.perfKpiId === actOn?.perfKpiId) ?? null;

  // Roles without a committee position — reviewer and viewer — resolve to no
  // stage role, so no row offers them a transition. Say why, rather than
  // leaving a column of dashes to be read as a bug.
  const readOnlyQueue =
    rows.length > 0 && rows.every((row) => stageRolesFor(row.committeeId).length === 0);

  // A plain render helper, not a nested component — a component declared here
  // would be a new type each render and remount its subtree on every keystroke.
  // Routes through the same runAction / setActOn path as the row buttons.
  const panelActions = (row: PerfKpiApproval) => {
    const actions = availableActions(
      stageRolesFor(row.committeeId),
      row.state as ApprovalState,
    );
    if (actions.length === 0) {
      return (
        <p className="text-body-sm text-mute">
          {row.state === "approved"
            ? "Locked after final approval. An administrator can reverse it."
            : "No actions available to you for this submission."}
        </p>
      );
    }
    return (
      <div className="flex flex-wrap items-center justify-end gap-sm">
        {actions.map((action) => (
          <Button
            key={action}
            size="sm"
            icon={ACTION_ICONS[action]}
            className={ACTION_TONE[action]}
            disabled={transition.isPending}
            onClick={() =>
              actionRequiresComment(action)
                ? setActOn({ perfKpiId: row.perfKpiId, action })
                : runAction(row, action)
            }
          >
            {ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
    );
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

      {readOnlyQueue && (
        <div className="mb-md flex items-center gap-sm rounded border border-hairline bg-surface-soft px-md py-sm text-body-sm text-mute">
          <Icon name="visibility" size={18} className="shrink-0" />
          <span>
            Read-only view. Submitting, forwarding and approving are tied to a
            committee position — you hold none on these committees, so no
            actions are available.
          </span>
        </div>
      )}

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
                  const actions = availableActions(
                    stageRolesFor(row.committeeId),
                    row.state as ApprovalState,
                  );
                  return (
                    <Tr key={row.perfKpiId} onClick={() => setDetailId(row.perfKpiId)}>
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
                                    ? setActOn({ perfKpiId: row.perfKpiId, action })
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

      {/* Performance detail + history + actions. Stays open across a
          transition — useApprovalTransition invalidates both the queue and the
          per-KPI approval, so the panel refreshes in place and the reviewer
          watches the new state and event land. */}
      <Drawer
        open={detail != null}
        onClose={() => setDetailId(null)}
        title={detail?.kpiName ?? "KPI"}
        subtitle={`${detail?.committeeName ?? detail?.committeeId ?? ""} · ${yearLabel(yearNo)} Q${quarterNo}`}
        headerExtra={detail && <ApprovalPanelStatus row={detail} />}
        // Escape must dismiss only the topmost surface: while the note modal is
        // open it owns the key, or one press would close both.
        closeOnEscape={!actOn}
        footer={detail && panelActions(detail)}
      >
        {detail && <ApprovalDetailPanel row={detail} yearLabel={yearLabel(yearNo)} />}
      </Drawer>

      {/* Note-required action (send back / reject) — layers over the drawer */}
      {actOn && actOnRow && (
        <NoteModal
          title={ACTION_LABELS[actOn.action]}
          subtitle={actOnRow.kpiName ?? ""}
          hint={
            actOn.action === "return"
              ? "The submission moves to 'Returned' for the committee member to revise."
              : "The submission moves back to 'Submitted' for the committee lead."
          }
          submitting={transition.isPending}
          onClose={() => setActOn(null)}
          onSend={(text) => {
            runAction(actOnRow, actOn.action, text);
            setActOn(null);
          }}
        />
      )}
    </>
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
