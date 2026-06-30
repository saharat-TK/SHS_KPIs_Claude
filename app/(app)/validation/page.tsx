"use client";

import { useMemo, useState } from "react";
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
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useValidations,
  useMetrics,
  useDepartments,
  useDecideValidation,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import type { ValidationStatus, ValidationSubmission } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ValidationPage() {
  return (
    <RequirePermission action="review_submissions">
      <ValidationQueue />
    </RequirePermission>
  );
}

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "clarification", label: "Clarification" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function ValidationQueue() {
  const { user } = useAuth();
  const validations = useValidations();
  const metrics = useMetrics();
  const departments = useDepartments();
  const decide = useDecideValidation();

  const [tab, setTab] = useState("pending");
  const [clarifyOn, setClarifyOn] = useState<ValidationSubmission | null>(null);
  const [detail, setDetail] = useState<ValidationSubmission | null>(null);

  const metricName = (id: string) => metrics.data?.find((m) => m.id === id)?.name ?? id;
  const deptName = (id: string) => departments.data?.find((d) => d.id === id)?.name ?? id;
  const metricUnit = (id: string) => metrics.data?.find((m) => m.id === id)?.unit ?? "";

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const v of validations.data ?? []) c[v.status] = (c[v.status] ?? 0) + 1;
    return c;
  }, [validations.data]);

  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: t.id === "all" ? validations.data?.length : counts[t.id] ?? 0,
  }));

  const rows = useMemo(() => {
    const list = validations.data ?? [];
    return tab === "all" ? list : list.filter((v) => v.status === tab);
  }, [validations.data, tab]);

  const act = (
    sub: ValidationSubmission,
    status: ValidationStatus,
    text?: string,
  ) =>
    decide.mutate({
      id: sub.id,
      status,
      reviewerId: user.id,
      comment: text
        ? {
            authorId: user.id,
            authorName: user.name,
            timestamp: new Date().toISOString(),
            text,
          }
        : undefined,
    });

  return (
    <>
      <PageHeader
        title="Validation Workflow"
        description="Review department-submitted metric values. Approve, reject, or request clarification."
        actions={<Button variant="outline" icon="summarize">Generate Report</Button>}
      />

      <Tabs items={tabs} active={tab} onChange={setTab} />

      <Card className="overflow-hidden">
        <QueryBoundary
          isLoading={validations.isLoading || metrics.isLoading}
          isError={validations.isError}
        >
          {rows.length === 0 ? (
            <EmptyState icon="task_alt" title="Nothing here" message="No submissions in this state." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Metric Name</Th>
                  <Th>Department</Th>
                  <Th align="right">Value</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <Tr key={v.id} onClick={() => setDetail(v)}>
                    <Td className="font-medium">{metricName(v.metricId)}</Td>
                    <Td className="text-mute">{deptName(v.departmentId)}</Td>
                    <Td align="right" className="font-medium">
                      {v.value} {metricUnit(v.metricId)}
                    </Td>
                    <Td className="text-mute">{formatDate(v.submittedDate)}</Td>
                    <Td>
                      <StatusPill status={v.status} kind="validation" />
                    </Td>
                    <Td align="right" onClick={(e) => e.stopPropagation()}>
                      {(v.status === "pending" || v.status === "clarification") ? (
                        <div className="flex items-center justify-end gap-xs">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="check"
                            className="text-success"
                            disabled={decide.isPending}
                            onClick={() => act(v, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="help"
                            disabled={decide.isPending}
                            onClick={() => setClarifyOn(v)}
                          >
                            Clarify
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="close"
                            className="text-error"
                            disabled={decide.isPending}
                            onClick={() => act(v, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-caption-sm text-mute">Resolved</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      {/* Request clarification */}
      {clarifyOn && (
        <ClarifyModal
          submission={clarifyOn}
          metricName={metricName(clarifyOn.metricId)}
          submitting={decide.isPending}
          onClose={() => setClarifyOn(null)}
          onSend={(text) => {
            act(clarifyOn, "clarification", text);
            setClarifyOn(null);
          }}
        />
      )}

      {/* Detail / comment thread */}
      {detail && (
        <Modal
          open
          onClose={() => setDetail(null)}
          title={metricName(detail.metricId)}
          subtitle={`${deptName(detail.departmentId)} · ${detail.period}`}
          size="lg"
        >
          <div className="flex flex-col gap-lg">
            <div className="flex flex-wrap items-center gap-md">
              <Badge tone="neutral">Value: {detail.value} {metricUnit(detail.metricId)}</Badge>
              <StatusPill status={detail.status} kind="validation" />
              <span className="text-caption-sm text-mute">Submitted {formatDate(detail.submittedDate)}</span>
            </div>
            <div className="flex flex-col gap-sm">
              <p className="text-label-md text-on-surface">Review thread</p>
              {detail.comments.length === 0 ? (
                <p className="text-body-sm text-mute">No comments yet.</p>
              ) : (
                detail.comments.map((c, i) => (
                  <div key={i} className="rounded-lg border border-hairline bg-surface-soft p-md">
                    <div className="flex items-center gap-sm">
                      <Icon name="account_circle" size={18} className="text-mute" />
                      <span className="text-label-md">{c.authorName}</span>
                      <span className="text-caption-sm text-mute">{formatDate(c.timestamp)}</span>
                    </div>
                    <p className="mt-xs text-body-sm">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function ClarifyModal({
  submission,
  metricName,
  onClose,
  onSend,
  submitting,
}: {
  submission: ValidationSubmission;
  metricName: string;
  onClose: () => void;
  onSend: (text: string) => void;
  submitting: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title="Request Clarification"
      subtitle={metricName}
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
            Send Request
          </Button>
        </>
      }
    >
      <Field label="Message to submitter" hint="The submission moves to 'Clarification' status.">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs clarifying?"
          autoFocus
        />
      </Field>
    </Modal>
  );
}
