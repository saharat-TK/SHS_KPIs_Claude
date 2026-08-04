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
  Combobox,
  TransferList,
  useToast,
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  useCommittees,
  useCommitteeUsage,
  useCreateCommittee,
  useUpdateCommittee,
  useDeleteCommittee,
  useFacultyRecords,
  useCommitteeMemberships,
  useCreateCommitteeMembership,
  useUpdateCommitteeMembership,
  useDeleteCommitteeMembership,
  type CommitteeInput,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  describeCommitteeUsage,
  diffCounselorLeadSlots,
  diffOneSlot,
  type MembershipAction,
  type SlotState,
} from "@/lib/kpi/committee";
import type {
  Committee,
  CommitteeMembership,
  EntityStatus,
  FacultyRecord,
  Position,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type SingletonSlotKey = "counselor" | "committeeLead" | "committeeAndSecretary";
interface RosterState {
  counselor: SlotState;
  committeeLead: SlotState;
  committeeAndSecretary: SlotState;
  committeeMembers: { facultyId: string; kpiFocus: string }[];
}

/** One state for both flows, discriminated by `"id" in editing` — the same
 *  shape the Units admin page uses. */
type Editing = Committee | { isNew: true } | null;

const STATUS_OPTIONS: EntityStatus[] = ["active", "inactive", "draft"];

const SINGLETON_SLOTS: { key: SingletonSlotKey; label: string }[] = [
  { key: "counselor", label: "Counselor" },
  { key: "committeeLead", label: "Committee Lead" },
  { key: "committeeAndSecretary", label: "Committee and Secretary" },
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
    // A combined row fills both slots with the same person and the same
    // shared KPI Focus text — see diffCounselorLeadSlots for the save side.
    else if (m.position === "Counselor and Committee Lead") {
      state.counselor = slot;
      state.committeeLead = { ...slot };
    } else state.committeeMembers.push(slot);
  }
  return state;
}

function diffRoster(
  initial: RosterState,
  draft: RosterState,
  ops: {
    create: (facultyId: string, position: Position, kpiFocus: string) => Promise<unknown>;
    update: (facultyId: string, kpiFocus: string, position?: Position) => Promise<unknown>;
    remove: (facultyId: string) => Promise<unknown>;
  },
): Array<() => Promise<unknown>> {
  const actions: Array<() => Promise<unknown>> = [];

  const applyMembershipActions = (membershipActions: MembershipAction[]) => {
    for (const a of membershipActions) {
      if (a.type === "create") actions.push(() => ops.create(a.facultyId, a.position, a.kpiFocus));
      else if (a.type === "update") actions.push(() => ops.update(a.facultyId, a.kpiFocus, a.position));
      else actions.push(() => ops.remove(a.facultyId));
    }
  };

  // Counselor and Committee Lead may be the same person (one combined row),
  // so they're reconciled together rather than as two independent slots.
  applyMembershipActions(
    diffCounselorLeadSlots(
      { counselor: initial.counselor, committeeLead: initial.committeeLead },
      { counselor: draft.counselor, committeeLead: draft.committeeLead },
    ),
  );
  applyMembershipActions(
    diffOneSlot(initial.committeeAndSecretary, draft.committeeAndSecretary, "Committee and Secretary"),
  );

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
  const facultyRecords = useFacultyRecords();
  const memberships = useCommitteeMemberships();
  const create = useCreateCommittee();
  const update = useUpdateCommittee();
  const del = useDeleteCommittee();
  const createMembership = useCreateCommitteeMembership();
  const updateMembership = useUpdateCommitteeMembership();
  const deleteMembership = useDeleteCommitteeMembership();
  const confirm = useConfirm();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
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
    ? facultyById.get(activeCommittee.headId)?.name
    : undefined;

  // Data sources and library KPIs/metrics aren't in this page's cache, so the
  // reason a delete is blocked has to come from the server.
  const usage = useCommitteeUsage(can("manage_faculty") ? activeId : null);
  const deleteBlockedBy = usage.data ? describeCommitteeUsage(usage.data) : null;
  // Fail closed: until the counts have actually arrived we don't know that
  // deleting is safe, so an unanswered or failed check keeps the button off.
  const canDelete = !!usage.data && !deleteBlockedBy;
  const deleteTitle = deleteBlockedBy
    ? deleteBlockedBy
    : usage.isError
      ? "Couldn't check what is attached to this committee — reload and try again."
      : usage.data
        ? "Delete committee"
        : "Checking what is attached…";

  return (
    <>
      <PageHeader
        title="Committees"
        description="Organizational structure of the School of Health Sciences."
        actions={
          can("manage_faculty") && (
            <Button
              icon="add"
              variant="outline"
              onClick={() => setEditing({ isNew: true })}
            >
              Add Committee
            </Button>
          )
        }
      />

      <QueryBoundary
        isLoading={
          committees.isLoading || facultyRecords.isLoading || memberships.isLoading
        }
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
                        <>
                          <Button
                            size="sm"
                            icon="groups"
                            onClick={() => setRosterOpen(true)}
                          >
                            Manage Roster
                          </Button>
                          <button
                            aria-label="Edit committee"
                            title="Edit committee"
                            className="text-mute hover:text-on-surface p-xs rounded hover:bg-surface-soft disabled:opacity-50"
                            disabled={update.isPending || del.isPending}
                            onClick={() => setEditing(activeCommittee)}
                          >
                            <Icon name="edit" size={18} />
                          </button>
                          <button
                            aria-label="Delete committee"
                            title={deleteTitle}
                            className="text-mute hover:text-error p-xs rounded hover:bg-surface-soft disabled:opacity-50 disabled:hover:text-mute"
                            disabled={del.isPending || !canDelete}
                            onClick={async () => {
                              if (
                                await confirm({
                                  title: "Delete committee",
                                  message: `Delete "${activeCommittee.name}"? This can't be undone.`,
                                  confirmLabel: "Delete",
                                })
                              ) {
                                del.mutate(activeCommittee.id, {
                                  onSuccess: () => setSelected(null),
                                });
                              }
                            }}
                          >
                            <Icon name="delete" size={18} />
                          </button>
                        </>
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

      {editing && (
        <CommitteeModal
          editing={editing}
          faculty={facultyRecords.data ?? []}
          submitting={create.isPending || update.isPending}
          error={
            (create.error instanceof Error && create.error.message) ||
            (update.error instanceof Error && update.error.message) ||
            undefined
          }
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            if ("id" in payload) {
              const { id, ...patch } = payload;
              update.mutate({ id, patch }, { onSuccess: () => setEditing(null) });
            } else {
              create.mutate(payload, {
                onSuccess: (d) => {
                  setEditing(null);
                  setSelected(d.id);
                },
              });
            }
          }}
        />
      )}

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

  // Counselor and Committee Lead may be the same person — each one's dropdown
  // additionally allows whoever currently occupies the other of the pair.
  // Committee and Secretary keeps the plain single-exception exclusion.
  const optionsFor = (key: SingletonSlotKey) => {
    const currentId = draft[key]?.facultyId;
    const alsoAllow =
      key === "counselor"
        ? draft.committeeLead?.facultyId
        : key === "committeeLead"
          ? draft.counselor?.facultyId
          : undefined;
    return faculty.filter(
      (f) => !assignedIds.has(f.id) || f.id === currentId || f.id === alsoAllow,
    );
  };

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
      update: (facultyId, kpiFocus, position) =>
        updateMembership.mutateAsync({
          facultyId,
          committeeId,
          patch: position ? { position, kpiFocus } : { kpiFocus },
        }),
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
          const options = optionsFor(key);
          return (
            <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
              <Field label={label}>
                <Combobox
                  value={slot?.facultyId ?? ""}
                  onChange={(facultyId) => updateSlot(key, { facultyId })}
                  options={options.map((f) => ({ id: f.id, label: f.name }))}
                  placeholder="None"
                />
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

function CommitteeModal({
  editing,
  faculty,
  onClose,
  onSave,
  submitting,
  error,
}: {
  editing: Editing;
  faculty: FacultyRecord[];
  onClose: () => void;
  onSave: (payload: CommitteeInput | (CommitteeInput & { id: string })) => void;
  submitting: boolean;
  error?: string;
}) {
  const existing = editing && "id" in editing ? editing : null;
  const [name, setName] = useState(existing?.name ?? "");
  const [keyMetric, setKeyMetric] = useState(
    existing && existing.keyMetric !== "—" ? existing.keyMetric : "",
  );
  const [status, setStatus] = useState<EntityStatus>(existing?.status ?? "active");
  const [headId, setHeadId] = useState(existing?.headId ?? "");

  const valid = name.trim().length > 1;

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? "Edit Committee" : "Add Committee"}
      subtitle="A standing committee of the School of Health Sciences."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() => {
              const base = {
                name: name.trim(),
                // The column is NOT NULL and the cards render an em dash for "unset".
                keyMetric: keyMetric.trim() || "—",
                status,
                headId: headId.trim(),
              };
              onSave(existing ? { ...base, id: existing.id } : base);
            }}
          >
            {submitting ? "Saving…" : existing ? "Save Changes" : "Add Committee"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        {error && (
          <div className="rounded border border-error/30 bg-error/10 px-md py-sm text-body-sm text-error">
            {error}
          </div>
        )}
        <Field label="Committee Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quality Assurance Committee"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="Key Metric" hint="Optional">
            <Input
              value={keyMetric}
              onChange={(e) => setKeyMetric(e.target.value)}
              placeholder="e.g. Curriculum Quality"
            />
          </Field>
          <Field label="Status" hint="Set to Inactive to archive without deleting">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntityStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Lead Faculty" hint="Optional">
          <Combobox
            value={headId}
            onChange={setHeadId}
            options={faculty.map((f) => ({ id: f.id, label: f.name }))}
            placeholder="None"
          />
        </Field>
      </div>
    </Modal>
  );
}
