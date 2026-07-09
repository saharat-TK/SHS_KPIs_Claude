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
  TransferList,
  useToast,
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  useCommittees,
  useFaculty,
  useCreateCommittee,
  useFacultyRecords,
  useCommitteeMemberships,
  useCreateCommitteeMembership,
  useUpdateCommitteeMembership,
  useDeleteCommitteeMembership,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Committee, CommitteeMembership, FacultyRecord, Position } from "@/lib/types";
import { cn } from "@/lib/utils";

type SingletonSlotKey = "counselor" | "committeeLead" | "committeeAndSecretary";
type SlotState = { facultyId: string; kpiFocus: string } | null;
interface RosterState {
  counselor: SlotState;
  committeeLead: SlotState;
  committeeAndSecretary: SlotState;
  committeeMembers: { facultyId: string; kpiFocus: string }[];
}

const SINGLETON_SLOTS: { key: SingletonSlotKey; position: Position; label: string }[] = [
  { key: "counselor", position: "Counselor", label: "Counselor" },
  { key: "committeeLead", position: "Committee Lead", label: "Committee Lead" },
  { key: "committeeAndSecretary", position: "Committee and Secretary", label: "Committee and Secretary" },
];

function buildRosterState(memberships: CommitteeMembership[]): RosterState {
  const state: RosterState = {
    counselor: null,
    committeeLead: null,
    committeeAndSecretary: null,
    committeeMembers: [],
  };
  for (const m of memberships) {
    const slot = { facultyId: m.facultyId, kpiFocus: m.kpiFocus };
    if (m.position === "Counselor") state.counselor = slot;
    else if (m.position === "Committee Lead") state.committeeLead = slot;
    else if (m.position === "Committee and Secretary") state.committeeAndSecretary = slot;
    else state.committeeMembers.push(slot);
  }
  return state;
}

function diffRoster(
  initial: RosterState,
  draft: RosterState,
  ops: {
    create: (facultyId: string, position: Position, kpiFocus: string) => Promise<unknown>;
    update: (facultyId: string, kpiFocus: string) => Promise<unknown>;
    remove: (facultyId: string) => Promise<unknown>;
  },
): Array<() => Promise<unknown>> {
  const actions: Array<() => Promise<unknown>> = [];

  for (const { key, position } of SINGLETON_SLOTS) {
    const old = initial[key];
    const next = draft[key];
    if (!old && next) {
      actions.push(() => ops.create(next.facultyId, position, next.kpiFocus));
    } else if (old && !next) {
      actions.push(() => ops.remove(old.facultyId));
    } else if (old && next) {
      if (old.facultyId !== next.facultyId) {
        actions.push(() => ops.remove(old.facultyId));
        actions.push(() => ops.create(next.facultyId, position, next.kpiFocus));
      } else if (old.kpiFocus !== next.kpiFocus) {
        actions.push(() => ops.update(old.facultyId, next.kpiFocus));
      }
    }
  }

  const oldMembers = new Map(initial.committeeMembers.map((m) => [m.facultyId, m.kpiFocus]));
  const newMembers = new Map(draft.committeeMembers.map((m) => [m.facultyId, m.kpiFocus]));

  for (const [facultyId, kpiFocus] of newMembers) {
    if (!oldMembers.has(facultyId)) {
      actions.push(() => ops.create(facultyId, "Committee", kpiFocus));
    } else if (oldMembers.get(facultyId) !== kpiFocus) {
      actions.push(() => ops.update(facultyId, kpiFocus));
    }
  }
  for (const [facultyId] of oldMembers) {
    if (!newMembers.has(facultyId)) {
      actions.push(() => ops.remove(facultyId));
    }
  }

  return actions;
}

export default function CommitteePage() {
  const { can } = useAuth();
  const committees = useCommittees();
  const faculty = useFaculty();
  const facultyRecords = useFacultyRecords();
  const memberships = useCommitteeMemberships();
  const create = useCreateCommittee();
  const createMembership = useCreateCommitteeMembership();
  const updateMembership = useUpdateCommitteeMembership();
  const deleteMembership = useDeleteCommitteeMembership();
  const confirm = useConfirm();
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);

  const facultyById = useMemo(() => {
    const m = new Map<string, FacultyRecord>();
    for (const f of facultyRecords.data ?? []) m.set(f.id, f);
    return m;
  }, [facultyRecords.data]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const mem of memberships.data ?? [])
      m.set(mem.committeeId, (m.get(mem.committeeId) ?? 0) + 1);
    return m;
  }, [memberships.data]);

  const activeId = selected ?? committees.data?.[0]?.id ?? null;
  const activeCommittee = committees.data?.find((d) => d.id === activeId);
  const committeeMemberships = (memberships.data ?? []).filter(
    (m) => m.committeeId === activeId,
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
        isLoading={committees.isLoading || faculty.isLoading || memberships.isLoading}
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
                    <div className="flex items-center gap-sm">
                      <Badge tone="primary">
                        {committeeMemberships.length} members
                      </Badge>
                      {can("manage_faculty") && (
                        <Button
                          size="sm"
                          icon="groups"
                          onClick={() => setRosterOpen(true)}
                        >
                          Manage Roster
                        </Button>
                      )}
                    </div>
                  }
                />
                {committeeMemberships.length === 0 ? (
                  <EmptyState title="No faculty assigned" />
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Name</Th>
                        <Th>Rank</Th>
                        <Th>Position</Th>
                        <Th>Status</Th>
                        <Th>KPI Focus</Th>
                        {can("manage_faculty") && <Th align="right">Actions</Th>}
                      </tr>
                    </thead>
                    <tbody>
                      {committeeMemberships.map((m) => {
                        const rec = facultyById.get(m.facultyId);
                        return (
                          <Tr key={`${m.facultyId}-${m.committeeId}`}>
                            <Td className="font-medium">{m.facultyName}</Td>
                            <Td className="text-mute">{rec?.rank ?? "—"}</Td>
                            <Td className="text-mute">{m.position}</Td>
                            <Td>{rec ? <StatusPill status={rec.status} /> : "—"}</Td>
                            <Td className="text-mute">{m.kpiFocus}</Td>
                            {can("manage_faculty") && (
                              <Td align="right">
                                <button
                                  aria-label="Remove membership"
                                  className="text-mute hover:text-error p-xs rounded hover:bg-surface-soft"
                                  onClick={async () => {
                                    if (
                                      await confirm({
                                        title: "Remove membership",
                                        message: `Remove "${m.facultyName}" from this committee?`,
                                        confirmLabel: "Remove",
                                      })
                                    ) {
                                      deleteMembership.mutate({
                                        facultyId: m.facultyId,
                                        committeeId: m.committeeId,
                                      });
                                    }
                                  }}
                                >
                                  <Icon name="delete" size={18} />
                                </button>
                              </Td>
                            )}
                          </Tr>
                        );
                      })}
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

      {rosterOpen && activeCommittee && (
        <CommitteeRosterModal
          committeeId={activeCommittee.id}
          memberships={committeeMemberships}
          faculty={facultyRecords.data ?? []}
          onClose={() => setRosterOpen(false)}
          createMembership={createMembership}
          updateMembership={updateMembership}
          deleteMembership={deleteMembership}
        />
      )}
    </>
  );
}

function CommitteeRosterModal({
  committeeId,
  memberships,
  faculty,
  onClose,
  createMembership,
  updateMembership,
  deleteMembership,
}: {
  committeeId: string;
  memberships: CommitteeMembership[];
  faculty: FacultyRecord[];
  onClose: () => void;
  createMembership: ReturnType<typeof useCreateCommitteeMembership>;
  updateMembership: ReturnType<typeof useUpdateCommitteeMembership>;
  deleteMembership: ReturnType<typeof useDeleteCommitteeMembership>;
}) {
  const { toast } = useToast();
  const [initial] = useState<RosterState>(() => buildRosterState(memberships));
  const [draft, setDraft] = useState<RosterState>(() => buildRosterState(memberships));
  const [submitting, setSubmitting] = useState(false);

  const facultyName = (id: string) => faculty.find((f) => f.id === id)?.name ?? id;

  const assignedIds = new Set(
    [
      draft.counselor?.facultyId,
      draft.committeeLead?.facultyId,
      draft.committeeAndSecretary?.facultyId,
      ...draft.committeeMembers.map((m) => m.facultyId),
    ].filter((id): id is string => !!id),
  );

  const availableForTransfer = faculty
    .filter((f) => !assignedIds.has(f.id))
    .map((f) => ({ id: f.id, label: f.name }));

  const selectedForTransfer = draft.committeeMembers.map((m) => ({
    id: m.facultyId,
    label: facultyName(m.facultyId),
  }));

  const singletonOptions = (currentId: string | undefined) =>
    faculty.filter((f) => !assignedIds.has(f.id) || f.id === currentId);

  const missingKpiFocusCount = [
    draft.counselor,
    draft.committeeLead,
    draft.committeeAndSecretary,
    ...draft.committeeMembers,
  ].filter((slot) => slot && slot.kpiFocus.trim() === "").length;
  const canSave = missingKpiFocusCount === 0;

  const updateSlot = (
    key: SingletonSlotKey,
    patch: { facultyId?: string; kpiFocus?: string },
  ) => {
    setDraft((d) => {
      if (patch.facultyId === "") return { ...d, [key]: null };
      const current = d[key];
      const next = {
        facultyId: patch.facultyId ?? current?.facultyId ?? "",
        kpiFocus: patch.kpiFocus ?? current?.kpiFocus ?? "",
      };
      return { ...d, [key]: next };
    });
  };

  const handleSave = async () => {
    setSubmitting(true);
    const actions = diffRoster(initial, draft, {
      create: (facultyId, position, kpiFocus) =>
        createMembership.mutateAsync({ facultyId, committeeId, position, kpiFocus }),
      update: (facultyId, kpiFocus) =>
        updateMembership.mutateAsync({ facultyId, committeeId, patch: { kpiFocus } }),
      remove: (facultyId) => deleteMembership.mutateAsync({ facultyId, committeeId }),
    });
    const results = await Promise.allSettled(actions.map((run) => run()));
    setSubmitting(false);
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      toast(`${failed.length} of ${actions.length} changes failed to save`, "error");
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Manage Roster"
      subtitle="Assign single-holder roles and manage general committee members."
      footer={
        <div className="flex w-full items-center justify-between gap-md">
          {!canSave ? (
            <p className="text-caption-sm text-error">
              Fill in KPI Focus for {missingKpiFocusCount} assigned{" "}
              {missingKpiFocusCount === 1 ? "member" : "members"} before saving.
            </p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-sm">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!canSave || submitting} onClick={handleSave}>
              {submitting ? "Saving…" : "Save All Changes"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-lg">
        {SINGLETON_SLOTS.map(({ key, label }) => {
          const slot = draft[key];
          const options = singletonOptions(slot?.facultyId);
          return (
            <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
              <Field label={label}>
                <Select
                  value={slot?.facultyId ?? ""}
                  onChange={(e) => updateSlot(key, { facultyId: e.target.value })}
                >
                  <option value="">None</option>
                  {options.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="KPI Focus">
                <Input
                  value={slot?.kpiFocus ?? ""}
                  onChange={(e) => updateSlot(key, { kpiFocus: e.target.value })}
                  placeholder="e.g. Student Success"
                  disabled={!slot}
                />
              </Field>
            </div>
          );
        })}

        <div>
          <p className="text-label-md text-on-surface mb-sm">Committee Members</p>
          <TransferList
            available={availableForTransfer}
            selected={selectedForTransfer}
            availableTitle="Available Faculty"
            selectedTitle="Committee Members"
            onMoveToSelected={(item) =>
              setDraft((d) => ({
                ...d,
                committeeMembers: [...d.committeeMembers, { facultyId: item.id, kpiFocus: "" }],
              }))
            }
            onMoveToAvailable={(item) =>
              setDraft((d) => ({
                ...d,
                committeeMembers: d.committeeMembers.filter((m) => m.facultyId !== item.id),
              }))
            }
            renderSelectedExtra={(item) => {
              const member = draft.committeeMembers.find((m) => m.facultyId === item.id);
              return (
                <Input
                  value={member?.kpiFocus ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      committeeMembers: d.committeeMembers.map((m) =>
                        m.facultyId === item.id ? { ...m, kpiFocus: e.target.value } : m,
                      ),
                    }))
                  }
                  placeholder="KPI Focus"
                />
              );
            }}
          />
        </div>
      </div>
    </Modal>
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
