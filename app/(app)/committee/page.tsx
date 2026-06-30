"use client";

import { useMemo, useState } from "react";
import {
  PageHeader,
  Card,
  CardHeader,
  Table,
  Th,
  Td,
  Tr,
  Badge,
  Button,
  StatusPill,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  Select,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  useCommittees,
  useFaculty,
  useCreateCommittee,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Committee } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

export default function CommitteePage() {
  const { can } = useAuth();
  const committees = useCommittees();
  const faculty = useFaculty();
  const create = useCreateCommittee();
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of faculty.data ?? [])
      m.set(f.committeeId, (m.get(f.committeeId) ?? 0) + 1);
    return m;
  }, [faculty.data]);

  const activeId = selected ?? committees.data?.[0]?.id ?? null;
  const activeCommittee = committees.data?.find((d) => d.id === activeId);
  const committeeFaculty = (faculty.data ?? []).filter(
    (f) => f.committeeId === activeId,
  );
  const leadName = activeCommittee?.headId
    ? faculty.data?.find((f) => f.id === activeCommittee.headId)?.name
    : undefined;

  return (
    <>
      <PageHeader
        title="Committees"
        description="Organizational structure of the School of Health Sciences."
        actions={
          can("manage_faculty") && (
            <Button icon="add" variant="outline" onClick={() => setShowAdd(true)}>
              Add Committee
            </Button>
          )
        }
      />

      <QueryBoundary
        isLoading={committees.isLoading || faculty.isLoading}
        isError={committees.isError}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-lg">
          <div className="flex flex-col gap-sm">
            {committees.data?.map((d) => {
              const on = d.id === activeId;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={cn(
                    "text-left rounded-lg border p-lg transition-colors",
                    on
                      ? "border-primary-container bg-surface-soft"
                      : "border-hairline bg-surface-lowest hover:bg-surface-soft",
                  )}
                >
                  <div className="flex items-start justify-between gap-sm">
                    <div className="min-w-0">
                      <p className="text-body-strong text-on-surface truncate">
                        {d.name}
                      </p>
                      <p className="text-caption-sm text-mute truncate">
                        {d.faculty}
                      </p>
                    </div>
                    <StatusPill status={d.status} />
                  </div>
                  <div className="mt-md flex items-center gap-lg text-caption-sm text-mute">
                    <span className="inline-flex items-center gap-xs">
                      <Icon name="groups" size={16} />
                      {counts.get(d.id) ?? 0} faculty
                    </span>
                    <span className="inline-flex items-center gap-xs">
                      <Icon name="target" size={16} />
                      {d.keyMetric}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <Card className="overflow-hidden h-fit">
            {!activeCommittee ? (
              <EmptyState title="Select a committee" />
            ) : (
              <>
                <CardHeader
                  title={activeCommittee.name}
                  subtitle={`${activeCommittee.faculty} · Key metric: ${activeCommittee.keyMetric}${
                    leadName ? ` · Lead: ${leadName}` : ""
                  }`}
                  actions={
                    <Badge tone="primary">
                      {committeeFaculty.length} members
                    </Badge>
                  }
                />
                {committeeFaculty.length === 0 ? (
                  <EmptyState title="No faculty assigned" />
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Name</Th>
                        <Th>Rank</Th>
                        <Th>Status</Th>
                        <Th align="right">Research Score</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {committeeFaculty.map((f) => (
                        <Tr key={f.id}>
                          <Td className="font-medium">{f.name}</Td>
                          <Td className="text-mute">{f.rank}</Td>
                          <Td>
                            <StatusPill status={f.status} />
                          </Td>
                          <Td align="right" className="font-medium">
                            {formatNumber(f.researchScore)}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </>
            )}
          </Card>
        </div>
      </QueryBoundary>

      <AddCommitteeModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        faculty={(faculty.data ?? []).map((f) => ({ id: f.id, name: f.name }))}
        submitting={create.isPending}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: (d) => {
              setShowAdd(false);
              setSelected(d.id);
            },
          })
        }
      />
    </>
  );
}

function AddCommitteeModal({
  open,
  onClose,
  faculty,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  faculty: { id: string; name: string }[];
  onSubmit: (input: Omit<Committee, "id">) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [headId, setHeadId] = useState("");

  const close = () => {
    setName("");
    setHeadId("");
    onClose();
  };

  const valid = name.trim().length > 1 && headId !== "";

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add Committee"
      subtitle="Create a new standing committee (stored in-session for this prototype)."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                faculty: "School of Health Science",
                status: "active",
                keyMetric: "—",
                headId,
              })
            }
          >
            {submitting ? "Saving…" : "Add Committee"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="Committee Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quality Assurance Committee"
          />
        </Field>
        <Field label="Lead Faculty">
          <Select value={headId} onChange={(e) => setHeadId(e.target.value)}>
            <option value="" disabled>
              Select lead faculty…
            </option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
