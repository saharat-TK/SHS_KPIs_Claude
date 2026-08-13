"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { healthOf, percentOfTarget, HEALTH_TONE } from "@/lib/kpi/progress";
import type {
  ApprovalAction,
  ApprovalState,
  PerfKpiApproval,
  StageRole,
} from "@/lib/types";
import { formatNumber } from "@/lib/utils";

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

// Workflow order, not alphabetical — matches the tab order in STATE_TABS, so
// ascending reads as "earliest stage first".
const STATUS_ORDER: Record<ApprovalState, number> = {
  draft: 0,
  submitted: 1,
  returned: 2,
  forwarded: 3,
  approved: 4,
};

type SortKey = "kpi" | "committee" | "period" | "status";
type SortState = { key: SortKey; dir: "asc" | "desc" };

/** A figure with its unit beneath, or a bare dash. Shared by the Annual Target
 *  and Recorded columns so the pair reads identically; the unit sits on its own
 *  muted line to keep the number scannable in a ~10% column. */
function NumberCell({ value, unit }: { value?: number | null; unit?: string | null }) {
  if (value == null) return <>—</>;
  return (
    <>
      {formatNumber(value, 2)}
      {unit && <span className="block text-caption-sm font-normal text-mute">{unit}</span>}
    </>
  );
}

/** Percent of Annual Target achieved, colored by the KPI's own threshold
 *  bucket — the same green/amber/red used everywhere else in the app. Divides
 *  by Annual Target (not a derived quarter target) on purpose: it's the only
 *  target number visible in this row, so the math stays transparent. No color
 *  without both a percent and configured thresholds. */
function ProgressBadge({
  current,
  target,
  thresholdGreen,
  thresholdAmber,
}: {
  current?: number | null;
  target?: number | null;
  thresholdGreen?: number | null;
  thresholdAmber?: number | null;
}) {
  const pct = percentOfTarget(current, target);
  const hasThresholds = thresholdGreen != null && thresholdAmber != null;
  const health =
    hasThresholds && pct != null ? healthOf(pct, { green: thresholdGreen, amber: thresholdAmber }) : null;

  if (pct == null) return <span className="text-caption-sm text-mute">—</span>;
  return <Badge tone={health ? HEALTH_TONE[health] : "neutral"}>{formatNumber(pct, 0)}%</Badge>;
}

function ApprovalQueue() {
  const { user } = useAuth();
  const records = usePerformanceRecords();
  const memberships = useCommitteeMemberships();

  const [recordId, setRecordId] = useState(0);
  const [yearNo, setYearNo] = useState(1);
  const [quarterNo, setQuarterNo] = useState(1);
  const [tab, setTab] = useState("all");
  // Both hold ids, not row objects: acting from the panel changes a row's
  // state, and a captured object would keep offering the pre-transition
  // actions. Same pattern as editingMetricId on the KPI detail page.
  const [actOn, setActOn] = useState<{ perfKpiId: number; action: ApprovalAction } | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [sort, setSort] = useState<SortState | null>(null);

  // Default to the first record once loaded.
  const activeRecord = records.data?.find((r) => r.id === recordId) ?? records.data?.[0];
  useEffect(() => {
    if (!recordId && records.data?.length) setRecordId(records.data[0].id);
  }, [recordId, records.data]);

  const approvals = useRecordApprovals(activeRecord?.id ?? 0, yearNo, quarterNo);
  const transition = useApprovalTransition(activeRecord?.id ?? 0);

  // user.role *is* faculty.system_role now — resolved server-side per request
  // by getSessionActor, so it matches what the API will actually authorize.
  // This used to look the row up in the faculty query, which read false while
  // that query was still loading and briefly hid the reverse button.
  const isSystemAdmin = user.role === "admin";

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

  // Period ties on every row today — the cell renders the page-level
  // year/quarter selectors, not a per-row field — so sorting by it is
  // currently a visible no-op. Wired up anyway for header consistency.
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const valueFor = (row: PerfKpiApproval): string | number | null => {
      switch (sort.key) {
        case "kpi":
          return row.kpiName ?? null;
        case "committee":
          return row.committeeName ?? row.committeeId ?? null;
        case "period":
          return yearNo * 4 + quarterNo;
        case "status":
          return STATUS_ORDER[row.state as ApprovalState];
      }
    };
    return [...rows].sort((left, right) => {
      const l = valueFor(left);
      const r = valueFor(right);
      // Missing values always follow populated values, regardless of direction.
      if (l == null) return r == null ? 0 : 1;
      if (r == null) return -1;
      const cmp =
        typeof l === "number" && typeof r === "number"
          ? l - r
          : String(l).localeCompare(String(r), undefined, { sensitivity: "base", numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, yearNo, quarterNo]);

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current?.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

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
              {/* Auto layout on purpose (no table-fixed): the percentages act
                  as targets, the `1%` + nowrap columns shrink to their content,
                  and whatever is left over widens the KPI column. minWidth
                  scrolls the wrapper on narrow screens instead of crushing. */}
              <colgroup>
                <col style={{ width: "35%", minWidth: "260px" }} />
                <col style={{ width: "20%", minWidth: "160px" }} />
                <col style={{ width: "10%", minWidth: "90px" }} />
                <col style={{ width: "10%", minWidth: "90px" }} />
                <col style={{ width: "1%" }} />
                <col style={{ width: "1%" }} />
                <col style={{ width: "1%" }} />
                <col style={{ width: "1%" }} />
              </colgroup>
              <thead>
                <tr>
                  <Th
                    sortable
                    sortDir={sort?.key === "kpi" ? sort.dir : null}
                    onSort={() => toggleSort("kpi")}
                  >
                    KPI
                  </Th>
                  <Th
                    sortable
                    sortDir={sort?.key === "committee" ? sort.dir : null}
                    onSort={() => toggleSort("committee")}
                  >
                    Committee
                  </Th>
                  <Th align="right">Annual Target</Th>
                  <Th align="right">Recorded</Th>
                  <Th align="center" className="whitespace-nowrap">
                    % Progress
                  </Th>
                  <Th
                    sortable
                    sortDir={sort?.key === "period" ? sort.dir : null}
                    onSort={() => toggleSort("period")}
                    className="whitespace-nowrap"
                  >
                    Period
                  </Th>
                  <Th
                    sortable
                    sortDir={sort?.key === "status" ? sort.dir : null}
                    onSort={() => toggleSort("status")}
                    className="whitespace-nowrap"
                  >
                    Status
                  </Th>
                  <Th align="right" className="whitespace-nowrap">
                    Actions
                  </Th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const actions = availableActions(
                    stageRolesFor(row.committeeId),
                    row.state as ApprovalState,
                  );
                  return (
                    <Tr key={row.perfKpiId} onClick={() => setDetailId(row.perfKpiId)}>
                      <Td className="font-medium">{row.kpiName}</Td>
                      <Td className="text-mute">{row.committeeName ?? row.committeeId}</Td>
                      <Td align="right" className="font-medium">
                        <NumberCell value={row.annualTarget} unit={row.unit} />
                      </Td>
                      <Td align="right" className="font-medium">
                        <NumberCell value={row.progressValue} unit={row.unit} />
                      </Td>
                      <Td align="center" className="whitespace-nowrap">
                        <ProgressBadge
                          current={row.progressValue}
                          target={row.annualTarget}
                          thresholdGreen={row.thresholdGreen}
                          thresholdAmber={row.thresholdAmber}
                        />
                      </Td>
                      <Td className="whitespace-nowrap text-mute">
                        {yearLabel(yearNo)} · Q{quarterNo}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <StatusPill status={row.state as ApprovalState} kind="approval" />
                      </Td>
                      <Td
                        align="right"
                        className="whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
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
        headerActions={
          detail && (
            <Link
              href={`/kpi-management/performance/${detail.recordId}/kpis/${detail.perfKpiId}`}
              aria-label="Open full KPI performance record"
              title="Open full KPI performance record"
              className="text-mute hover:text-on-surface rounded p-xs hover:bg-surface-soft transition-colors"
            >
              <Icon name="open_in_new" size={20} />
            </Link>
          )
        }
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
