"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PageHeader,
  Button,
  Badge,
  Modal,
  Field,
  Input,
  Table,
  Th,
  Td,
  Tr,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
  QueryBoundary,
  EmptyState,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  usePerfKpi,
  usePerfKpiSources,
  usePerfMetricsByKpi,
  usePerformancePeriods,
  usePerformanceRecord,
  useSaveKpiProgress,
  useKpiApproval,
  useCommitteeMemberships,
  useApprovalTransition,
  useKpiTypes,
} from "@/lib/data/hooks";
import {
  targetForYear,
  percentOfTarget,
  quarterTargetFor,
  HEALTH_TONE,
} from "@/lib/kpi/progress";
import {
  approvalLockForState,
  actionRequiresComment,
  availableActions,
  resolvePositionFromMemberships,
  resolveStageRoles,
} from "@/lib/kpi/approvalWorkflow";
import { formatNumber } from "@/lib/utils";
import {
  KPI_TYPES,
  type ApprovalAction,
  type ApprovalState,
  type PerfMetric,
} from "@/lib/types";
import { ProgressPanel, type QuarterEntryAction } from "./ProgressPanel";
import { MetricProgressModal } from "./MetricProgressModal";
import { AnnualQuarterProgressMatrix } from "./AnnualQuarterProgressMatrix";
import { LinkedDataSourcesSection } from "./LinkedDataSourcesSection";

const DIRECT_ACTION_LABEL: Partial<Record<ApprovalAction, string>> = {
  submit: "Submit to Committee lead",
  return: "Send back",
  forward: "Forward to counselor",
  reject: "Reject",
  approve: "Approve",
};

const DIRECT_ACTION_ICON: Partial<Record<ApprovalAction, string>> = {
  submit: "send",
  return: "undo",
  forward: "forward",
  reject: "close",
  approve: "approval",
};

const POSITIVE_APPROVAL_BUTTON_CLASS =
  "rounded-xl border-transparent bg-lime-400 text-slate-950 hover:bg-lime-500 disabled:bg-lime-400 disabled:text-slate-950 disabled:opacity-60";
const NEGATIVE_APPROVAL_BUTTON_CLASS =
  "rounded-xl border-transparent bg-red-400 text-slate-950 hover:bg-red-500 disabled:bg-red-400 disabled:text-slate-950 disabled:opacity-60";

export default function PerfKpiProgressPage() {
  return (
    <RequirePermission action="submit_metrics">
      <PerfKpiProgress />
    </RequirePermission>
  );
}

function PerfKpiProgress() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams<{ recordId: string; perfKpiId: string }>();
  const recordId = Number(params.recordId);
  const perfKpiId = Number(params.perfKpiId);

  const kpiQ = usePerfKpi(perfKpiId);
  const kpiTypesQ = useKpiTypes();
  const recordQ = usePerformanceRecord(recordId);
  const periodsQ = usePerformancePeriods(recordId);
  const metricsQ = usePerfMetricsByKpi(perfKpiId);
  const sourcesQ = usePerfKpiSources(perfKpiId);
  const save = useSaveKpiProgress(perfKpiId);
  const membershipsQ = useCommitteeMemberships();
  const approvalTransition = useApprovalTransition(recordId);
  // Approval lock for the currently-selected quarter (defined after year/quarter).

  // Year selection is lifted here so the Sub-KPIs table stays in sync with the
  // ProgressPanel's Year tabs.
  const [year, setYear] = useState(1);
  // Quarter selection is also lifted so sub-KPIs reflect and record only the
  // quarter selected in the upper quarter tabs.
  const [quarter, setQuarter] = useState(1);
  // Entering progress for a sub-KPI opens a pop-up instead of navigating away.
  // Store only the id (not the metric object) so the pop-up re-derives a fresh
  // metric from `metrics` after a save invalidates the list query — otherwise
  // the pop-up would keep showing the stale value it was opened with.
  const [editingMetricId, setEditingMetricId] = useState<number | null>(null);
  const [noteAction, setNoteAction] = useState<ApprovalAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ApprovalAction | null>(null);

  // Review/final approval states lock this KPI and all its metrics. Backend
  // enforces it; this drives the read-only UI and quarter-tab labels.
  const kpi = kpiQ.data;
  const recordReadOnly = recordQ.data != null && recordQ.data.status !== "active";
  const recordReadOnlyMessage = recordReadOnly
    ? `This performance record is ${recordQ.data?.status} and is view-only. Reactivate it to record progress.`
    : undefined;
  const metrics = metricsQ.data ?? [];
  const sources = useMemo(() => sourcesQ.data ?? [], [sourcesQ.data]);
  // A metric is fed only by a link that actually MAPS a value. An evidence-only
  // link (empty mappings) never overwrites progress, so it must not lock entry.
  const fedLibraryMetricIds = useMemo(
    () =>
      new Set(
        sources
          .flatMap((s) => s.links)
          .filter((l) => l.libraryMetricId != null && l.mappings.length > 0)
          .map((l) => l.libraryMetricId as number),
      ),
    [sources],
  );
  const isMetricFed = (metric: PerfMetric) =>
    metric.sourceMetricId != null && fedLibraryMetricIds.has(metric.sourceMetricId);
  const fedSourceName = (metric: PerfMetric) =>
    sources.find((s) =>
      s.links.some(
        (l) => l.libraryMetricId === metric.sourceMetricId && l.mappings.length > 0,
      ),
    )?.name ?? null;
  const q1Approval = useKpiApproval(perfKpiId, year, 1);
  const q2Approval = useKpiApproval(perfKpiId, year, 2);
  const q3Approval = useKpiApproval(perfKpiId, year, 3);
  const q4Approval = useKpiApproval(perfKpiId, year, 4);
  const selectedApprovalQuery =
    quarter === 1 ? q1Approval : quarter === 2 ? q2Approval : quarter === 3 ? q3Approval : q4Approval;
  const approvalStatesByQuarter: Partial<Record<number, ApprovalState>> = {
    1: q1Approval.data?.approval.state,
    2: q2Approval.data?.approval.state,
    3: q3Approval.data?.approval.state,
    4: q4Approval.data?.approval.state,
  };
  const selectedApprovalState: ApprovalState = approvalStatesByQuarter[quarter] ?? "draft";
  const selectedApprovalLock = approvalLockForState(selectedApprovalState);
  // user.role *is* faculty.system_role now, resolved server-side per request —
  // no faculty-query round-trip, so no window where this reads false and hides
  // the reverse button from an admin. See resolveStageRoles.
  const isSystemAdmin = user.role === "admin";
  const stageRoles = useMemo(() => {
    const position = resolvePositionFromMemberships(
      membershipsQ.data,
      user.facultyId,
      kpi?.committeeId,
    );
    return resolveStageRoles(position, isSystemAdmin);
  }, [kpi?.committeeId, membershipsQ.data, user.facultyId, isSystemAdmin]);
  const directActions = useMemo(
    () =>
      !recordReadOnly && selectedApprovalState
        ? availableActions(stageRoles, selectedApprovalState).filter((action) => action !== "reverse")
        : [],
    [recordReadOnly, selectedApprovalState, stageRoles],
  );
  const approvalActionBusy =
    selectedApprovalQuery.isLoading ||
    selectedApprovalQuery.isFetching ||
    membershipsQ.isLoading ||
    membershipsQ.isFetching ||
    approvalTransition.isPending;
  const runApprovalAction = (action: ApprovalAction, comment?: string) =>
    approvalTransition.mutate({
      perfKpiId,
      input: {
        action,
        yearNo: year,
        quarterNo: quarter,
        comment,
      },
    });
  const handleApprovalAction = (action: ApprovalAction) => {
    if (actionRequiresComment(action)) {
      setNoteAction(action);
      return;
    }
    if (action === "approve") {
      setConfirmAction(action);
      return;
    }
    runApprovalAction(action);
  };
  const toQuarterAction = (action: ApprovalAction): QuarterEntryAction => ({
    key: action,
    label: DIRECT_ACTION_LABEL[action] ?? action,
    icon: DIRECT_ACTION_ICON[action],
    variant: action === "return" || action === "reject" ? "danger" : action === "approve" ? "primary" : "outline",
    className:
      action === "return" || action === "reject"
        ? NEGATIVE_APPROVAL_BUTTON_CLASS
        : POSITIVE_APPROVAL_BUTTON_CLASS,
    disabled: approvalActionBusy,
    requiresSavedData: action === "submit",
    onClick: () => handleApprovalAction(action),
  });
  const approvalActionsBeforeSave = directActions
    .filter((action) => action === "return" || action === "reject")
    .map(toQuarterAction);
  const approvalActionsAfterSave = directActions
    .filter((action) => action === "submit" || action === "forward" || action === "approve")
    .map(toQuarterAction);
  const allowSubmittedLeadEditing =
    selectedApprovalState === "submitted" && stageRoles.includes("lead");
  const allowForwardedCounselorEditing =
    selectedApprovalState === "forwarded" && stageRoles.includes("counselor");
  const allowApprovalLockedEditing = allowSubmittedLeadEditing || allowForwardedCounselorEditing;
  const hideApprovalLockMessage =
    (selectedApprovalState === "forwarded" &&
      directActions.includes("reject") &&
      directActions.includes("approve")) ||
    allowSubmittedLeadEditing;

  useBreadcrumbLabel(`/kpi-management/performance/${recordId}`, recordQ.data?.name);
  useBreadcrumbLabel(`/kpi-management/performance/${recordId}/kpis`, "KPIs");
  useBreadcrumbLabel(
    `/kpi-management/performance/${recordId}/kpis/${perfKpiId}`,
    kpiQ.data?.name,
  );

  return (
    <>
      <PageHeader
        title={kpi?.name ?? "KPI Progress"}
        description={
          kpi
            ? `${
                kpiTypesQ.data?.find((t) => t.id === kpi.kpiType)?.kpiTypeName ??
                KPI_TYPES.find((t) => t.id === kpi.kpiType)?.label ??
                kpi.kpiType
              } · weight ${kpi.weight}%`
            : "Loading…"
        }
        actions={
          <Button
            variant="ghost"
            icon="arrow_back"
            onClick={() => router.push(`/kpi-management/performance/${recordId}`)}
          >
            Back to Record
          </Button>
        }
      />

      <QueryBoundary isLoading={kpiQ.isLoading || !kpi} isError={kpiQ.isError}>
        {kpi && (
          <>
            <ProgressPanel
              startYear={kpi.startYear}
              annualTargets={kpi.annualTargets}
              progress={kpi.progress}
              thresholdGreen={kpi.thresholdGreen}
              thresholdAmber={kpi.thresholdAmber}
              unit={kpi.unit}
              // A fed KPI is as computed as a rolled-up one — typing over it
              // would just be overwritten by the next feed.
              valueEditable={!kpi.hasChildren && !kpi.fedBy}
              readOnly={recordReadOnly}
              readOnlyReason={recordReadOnlyMessage}
              // A link outranks the roll-up (rollsUpFromChildren in
              // lib/kpi/performance.ts), so test fedBy first — otherwise a
              // linked parent would claim its sub-KPIs produced a number they
              // had no part in.
              computedNote={
                kpi.fedBy
                  ? `This KPI's quarterly value is computed from the data source “${kpi.fedBy.dataSourceName}”. Edit the raw data there to change it.` +
                    (kpi.hasChildren
                      ? " Its sub-KPIs below are still recorded, but do not determine this value."
                      : "")
                  : kpi.hasChildren
                    ? "This KPI's quarterly value is computed from its sub-KPIs. Enter each sub-KPI's progress below."
                    : undefined
              }
              periods={periodsQ.data ?? []}
              periodsLoading={periodsQ.isLoading}
              approvalState={selectedApprovalState}
              approvalStatesByQuarter={approvalStatesByQuarter}
              approvalActionsBeforeSave={approvalActionsBeforeSave}
              approvalActionsAfterSave={approvalActionsAfterSave}
              hideApprovalLockMessage={hideApprovalLockMessage}
              allowApprovalLockedEditing={allowApprovalLockedEditing}
              saving={save.isPending}
              year={year}
              onYearChange={setYear}
              quarter={quarter}
              onQuarterChange={setQuarter}
              quarterlyTargetMode={kpi.quarterlyTargetMode}
              calculationType={kpi.calculationType}
              variable1Name={kpi.variable1Name}
              variable1Unit={kpi.variable1Unit}
              variable2Name={kpi.variable2Name}
              variable2Unit={kpi.variable2Unit}
              onSave={(yearNo, quarterNo, data) =>
                save.mutate({
                  ...data,
                  yearNo,
                  quarterNo,
                })
              }
              rightColumnContent={
                <AnnualQuarterProgressMatrix kpi={kpi} metrics={metrics} year={year} />
              }
              quarterContent={
                kpi.hasChildren ? (
                  <div className="border-t border-hairline">
                    <div className="flex flex-col gap-tiny px-md py-md">
                      <h3 className="text-heading-md text-on-surface">Sub-KPIs/Metrics</h3>
                      <p className="text-caption-sm text-mute">
                        Year {year}
                        {kpi.startYear ? ` · ${kpi.startYear + year - 1}` : ""} · Quarter {quarter}
                      </p>
                    </div>
                    {metrics.length === 0 ? (
                      <div className="px-md pb-md">
                        <EmptyState title="No sub-KPIs" message="This KPI has no metrics." />
                      </div>
                    ) : (
                      <Table>
                        <thead>
                          <tr>
                            <Th>Metric no.</Th>
                            <Th>Metrics</Th>
                            <Th align="right">Annual Target</Th>
                            <Th align="right">Q{quarter} Target</Th>
                            <Th align="right">Recorded Q{quarter}</Th>
                            <Th>Progress</Th>
                            <Th align="center">Status</Th>
                            <Th align="right">Actions</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((m, index) => {
                            const annualTarget = targetForYear(m.annualTargets, year);
                            const quarterTarget = quarterTargetFor(
                              annualTarget,
                              quarter,
                              kpi.quarterlyTargetMode,
                            );
                            const selectedProgress = m.progress?.find(
                              (p) => p.yearNo === year && p.quarterNo === quarter,
                            );
                            const current = selectedProgress?.progressValue ?? null;
                            const pct = percentOfTarget(current, quarterTarget);
                            const hasTh = m.thresholdGreen != null && m.thresholdAmber != null;
                            const health =
                              hasTh && pct != null
                                ? healthOf(pct, { green: m.thresholdGreen!, amber: m.thresholdAmber! })
                                : null;
                            const metricLocked =
                              recordReadOnly ||
                              (!!selectedApprovalLock?.locked && !allowApprovalLockedEditing);
                            const fed = isMetricFed(m);
                            const go = () => setEditingMetricId(m.id);
                            return (
                              <Tr key={m.id} onClick={go}>
                                <Td>
                                  <Badge tone="neutral">M{index + 1}</Badge>
                                </Td>
                                <Td className="font-medium">
                                  <span className="inline-flex items-center gap-xs">
                                    {m.name}
                                    {fed && (
                                      // Value comes from the feed; only Issue /
                                      // Solution stay editable in the pop-up.
                                      // Badge takes no title, so it rides on a wrapper.
                                      <span title={`Fed by ${fedSourceName(m) ?? "a data source"}`}>
                                        <Badge tone="info">
                                          <Icon name="database" size={14} />
                                          auto
                                        </Badge>
                                      </span>
                                    )}
                                  </span>
                                </Td>
                                <Td align="right">
                                  {annualTarget == null
                                    ? "—"
                                    : `${formatNumber(annualTarget, 2)} ${m.unit ?? ""}`}
                                </Td>
                                <Td align="right">
                                  {quarterTarget == null
                                    ? "—"
                                    : `${formatNumber(quarterTarget, 2)} ${m.unit ?? ""}`}
                                </Td>
                                <Td align="right">
                                  {current == null ? "—" : `${formatNumber(current, 2)} ${m.unit ?? ""}`}
                                </Td>
                                <Td>
                                  <div className="flex items-center gap-sm">
                                    {hasTh ? (
                                      <ThresholdBar
                                        value={pct ?? 0}
                                        max={100}
                                        thresholds={{ green: m.thresholdGreen!, amber: m.thresholdAmber! }}
                                        className="w-[80px]"
                                      />
                                    ) : (
                                      <div className="h-2 w-[80px] rounded-full bg-surface-container-high overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-primary-container"
                                          style={{ width: `${Math.max(0, Math.min(100, pct ?? 0))}%` }}
                                        />
                                      </div>
                                    )}
                                    <span className="text-caption-sm text-mute">
                                      {pct == null ? "—" : `${formatNumber(pct, 0)}%`}
                                    </span>
                                  </div>
                                </Td>
                                <Td align="center">
                                  {health ? (
                                    <Badge tone={HEALTH_TONE[health]}>{HEALTH_LABEL[health]}</Badge>
                                  ) : (
                                    <span className="text-mute">—</span>
                                  )}
                                </Td>
                                <Td align="right">
                                  {metricLocked && selectedApprovalLock ? (
                                    <Badge tone={selectedApprovalLock.tone}>
                                      <Icon name={selectedApprovalLock.icon} size={15} />
                                      {selectedApprovalLock.tabLabel}
                                    </Badge>
                                  ) : (
                                    <button
                                      type="button"
                                      aria-label={recordReadOnly ? "View progress" : "Enter progress"}
                                      title={recordReadOnly ? "View progress" : "Enter progress"}
                                      className="text-mute hover:text-on-surface"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        go();
                                      }}
                                    >
                                      <Icon name={recordReadOnly ? "visibility" : "edit_note"} size={20} />
                                    </button>
                                  )}
                                </Td>
                              </Tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    )}
                  </div>
                ) : undefined
              }
            />

            <LinkedDataSourcesSection
              kpi={kpi}
              sources={sources}
              metrics={metrics}
              isLoading={sourcesQ.isLoading}
              isError={sourcesQ.isError}
            />

            {!kpi.hasChildren && !kpi.fedBy && (
              <div className="flex items-center gap-sm text-caption-sm text-mute">
                <Badge tone="neutral">leaf KPI</Badge>
                Values are entered directly per quarter above.
              </div>
            )}

            {editingMetricId != null && (() => {
              const editingMetric = metrics.find((m) => m.id === editingMetricId);
              return editingMetric ? (
                <MetricProgressModal
                  key={editingMetric.id}
                  metric={editingMetric}
                  perfKpiId={perfKpiId}
                  year={year}
                  quarter={quarter}
                  quarterlyTargetMode={kpi.quarterlyTargetMode}
                  periods={periodsQ.data ?? []}
                  periodsLoading={periodsQ.isLoading}
                  approvalState={selectedApprovalState}
                  allowApprovalLockedEditing={allowApprovalLockedEditing}
                  readOnly={recordReadOnly}
                  readOnlyReason={recordReadOnlyMessage}
                  fedByName={
                    isMetricFed(editingMetric) ? fedSourceName(editingMetric) : null
                  }
                  onClose={() => setEditingMetricId(null)}
                />
              ) : null;
            })()}

            {noteAction && (
              <ApprovalNoteModal
                action={noteAction}
                kpiName={kpi.name}
                periodLabel={`Year ${year} · Quarter ${quarter}`}
                submitting={approvalTransition.isPending}
                onClose={() => setNoteAction(null)}
                onSend={(text) => {
                  runApprovalAction(noteAction, text);
                  setNoteAction(null);
                }}
              />
            )}

            {confirmAction === "approve" && (
              <ApproveConfirmModal
                kpiName={kpi.name}
                periodLabel={`Year ${year} · Quarter ${quarter}`}
                submitting={approvalTransition.isPending}
                onClose={() => setConfirmAction(null)}
                onApprove={() => {
                  runApprovalAction("approve");
                  setConfirmAction(null);
                }}
              />
            )}
          </>
        )}
      </QueryBoundary>
    </>
  );
}

function ApprovalNoteModal({
  action,
  kpiName,
  periodLabel,
  submitting,
  onClose,
  onSend,
}: {
  action: ApprovalAction;
  kpiName: string;
  periodLabel: string;
  submitting: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const title = DIRECT_ACTION_LABEL[action] ?? action;
  const hint =
    action === "return"
      ? "The submission moves to Returned for the committee member or secretary to revise."
      : "The submission moves back to Submitted for the committee lead to review again.";

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      subtitle={`${kpiName} · ${periodLabel}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon="send"
            className="rounded-DEFAULT"
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

function ApproveConfirmModal({
  kpiName,
  periodLabel,
  submitting,
  onClose,
  onApprove,
}: {
  kpiName: string;
  periodLabel: string;
  submitting: boolean;
  onClose: () => void;
  onApprove: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Approve KPI performance?"
      subtitle={`${kpiName} · ${periodLabel}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            icon="approval"
            className="rounded-DEFAULT"
            disabled={submitting}
            onClick={onApprove}
          >
            Approve
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-mute">
        Approval will lock this KPI and all of its metrics for the selected quarter.
        Contact an admin if reversal is needed after approval.
      </p>
    </Modal>
  );
}
