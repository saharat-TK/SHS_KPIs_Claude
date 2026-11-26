"use client";

import { useEffect, useMemo, useState } from "react";
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
  ActionMenu,
  RadioGroup,
  type ActionMenuItem,
  type RadioOption,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useStrategicSets,
  useCreateStrategicSet,
  useUpdateStrategicSet,
  useDeleteStrategicSet,
} from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import { currentBEYear } from "@/lib/kpi/cellFormats";
import {
  deleteBlockReason,
  deletionConfirmed,
  describeSetDeletion,
  startYearLockReason,
  cloneConfirmed,
  describeClone,
  CLONE_CONFIRM_PHRASE,
  type CloneMode,
} from "@/lib/kpi/setRules";
import type { StrategicSet, StrategicSetStatus } from "@/lib/types";

const STATUS_TONE: Record<StrategicSetStatus, "neutral" | "success" | "warning"> = {
  draft: "neutral",
  active: "success",
  archived: "warning",
};

const SET_STATUSES: StrategicSetStatus[] = ["draft", "active", "archived"];

function setMenuItems(
  set: StrategicSet,
  on: {
    onOpen: () => void;
    onConfigure: () => void;
    onSetStatus: (status: StrategicSetStatus) => void;
    onDelete: () => void;
  },
): ActionMenuItem[] {
  const blockReason = deleteBlockReason(set);
  return [
    { icon: "open_in_new", label: "Open set", onSelect: on.onOpen },
    { icon: "tune", label: "Configure set", onSelect: on.onConfigure },
    {
      icon: "change_circle",
      label: "Set status",
      separatorBefore: true,
      submenu: SET_STATUSES.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        selected: status === set.status,
        disabled: status === set.status,
        onSelect: () => on.onSetStatus(status),
      })),
    },
    {
      icon: "delete",
      label: "Delete set",
      separatorBefore: true,
      tone: "danger" as const,
      disabled: blockReason !== null,
      title: blockReason ?? undefined,
      onSelect: on.onDelete,
    },
  ];
}

export default function LibraryPage() {
  return (
    <RequirePermission action="configure_kpis">
      <Library />
    </RequirePermission>
  );
}

function Library() {
  const router = useRouter();
  const setsQ = useStrategicSets();
  const create = useCreateStrategicSet();
  const updateSet = useUpdateStrategicSet();
  const deleteSet = useDeleteStrategicSet();
  const [configureTarget, setConfigureTarget] = useState<StrategicSet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StrategicSet | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusChange, setStatusChange] = useState<{
    set: StrategicSet;
    status: StrategicSetStatus;
  } | null>(null);

  const sets = setsQ.data ?? [];

  return (
    <>
      <PageHeader
        title="KPIs Library"
        description="Author and version the School's 5-Year Strategic Sets — each set owns its own KPIs, sub-KPIs and targets."
        actions={
          <Button icon="add" onClick={() => setShowCreate(true)}>
            New Strategic Set
          </Button>
        }
      />

      <Card elevated className="overflow-hidden">
        <QueryBoundary isLoading={setsQ.isLoading} isError={setsQ.isError}>
          {sets.length === 0 ? (
            <EmptyState
              title="No strategic sets yet"
              message="Create the first 5-Year Strategic Set to start building the KPI library."
              action={
                <Button icon="add" onClick={() => setShowCreate(true)}>
                  New Strategic Set
                </Button>
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Set Name</Th>
                  <Th align="center">Years</Th>
                  <Th align="center">Status</Th>
                  <Th align="center">KPIs</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s) => (
                  <Tr
                    key={s.id}
                    onClick={() => router.push(`/kpi-management/library/${s.id}`)}
                  >
                    <Td className="font-medium">
                      {s.name}
                      {s.clonedFromSetId && (
                        <span className="ml-xs text-caption-sm text-mute">(cloned)</span>
                      )}
                    </Td>
                    <Td align="center">
                      {s.startYear}–{s.endYear}
                    </Td>
                    <Td align="center">
                      <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                    </Td>
                    <Td align="center">{s.kpiCount ?? 0}</Td>
                    {/* The whole cell stops propagation so the row's own
                        navigate-on-click can't fire behind the menu. */}
                    <Td align="right" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        label={`Actions for ${s.name}`}
                        items={setMenuItems(s, {
                          onOpen: () => router.push(`/kpi-management/library/${s.id}`),
                          onConfigure: () => setConfigureTarget(s),
                          onSetStatus: (status) => setStatusChange({ set: s, status }),
                          onDelete: () => setDeleteTarget(s),
                        })}
                      />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      <CreateSetModal
        open={showCreate}
        sets={sets}
        submitting={create.isPending}
        onClose={() => setShowCreate(false)}
        onCreate={(input) =>
          create.mutate(input, {
            onSuccess: (createdSet) => {
              setShowCreate(false);
              router.push(`/kpi-management/library/${(createdSet as StrategicSet).id}`);
            },
          })
        }
      />

      {configureTarget && (
        <ConfigureSetModal
          set={configureTarget}
          submitting={updateSet.isPending}
          onClose={() => setConfigureTarget(null)}
          onSave={(patch) =>
            updateSet.mutate(
              { id: configureTarget.id, patch },
              { onSuccess: () => setConfigureTarget(null) },
            )
          }
        />
      )}

      {deleteTarget && (
        <DeleteSetConfirmModal
          set={deleteTarget}
          submitting={deleteSet.isPending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() =>
            deleteSet.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            })
          }
        />
      )}

      {statusChange && (
        <SetStatusConfirmModal
          set={statusChange.set}
          status={statusChange.status}
          submitting={updateSet.isPending}
          onClose={() => setStatusChange(null)}
          onConfirm={() =>
            updateSet.mutate(
              { id: statusChange.set.id, patch: { status: statusChange.status } },
              { onSuccess: () => setStatusChange(null) },
            )
          }
        />
      )}
    </>
  );
}

function ConfigureSetModal({
  set,
  submitting,
  onClose,
  onSave,
}: {
  set: StrategicSet;
  submitting: boolean;
  onClose: () => void;
  onSave: (patch: { name?: string; description?: string; startYear?: number }) => void;
}) {
  const [name, setName] = useState(set.name);
  const [description, setDescription] = useState(set.description ?? "");
  const [startYear, setStartYear] = useState(set.startYear);
  const lockReason = startYearLockReason(set);
  const validYear = Number.isInteger(startYear) && startYear >= 2400 && startYear <= 2700;
  const changed =
    name.trim() !== set.name ||
    description.trim() !== (set.description ?? "") ||
    startYear !== set.startYear;
  const valid = name.trim().length > 1 && validYear;

  return (
    <Modal
      open
      onClose={onClose}
      title="Configure set"
      subtitle={set.name}
      footer={
        <>
          <Button variant="ghost" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || !changed || submitting}
            onClick={() =>
              onSave({
                name: name.trim(),
                description: description.trim(),
                ...(startYear !== set.startYear ? { startYear } : {}),
              })
            }
          >
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="Set Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Description" hint="Optional">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field
            label="Start Year (B.E.)"
            hint={lockReason ? `Locked — ${lockReason.toLowerCase()}` : "Only while draft and not yet activated"}
          >
            <Input
              type="number"
              min={2400}
              max={2700}
              value={startYear}
              disabled={lockReason !== null}
              onChange={(e) => setStartYear(Number(e.target.value))}
            />
          </Field>
          <Field label="End Year" hint="Auto-calculated (start + 4)">
            <Input value={String(startYear + 4)} readOnly disabled />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function DeleteSetConfirmModal({
  set,
  submitting,
  onClose,
  onConfirm,
}: {
  set: StrategicSet;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const confirmed = deletionConfirmed(typed, set.name);

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete strategic set"
      subtitle={set.name}
      size="md"
      footer={
        <>
          <Button variant="ghost" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon="delete"
            className="disabled:cursor-not-allowed disabled:bg-surface-dim disabled:text-mute disabled:shadow-none"
            disabled={!confirmed || submitting}
            onClick={onConfirm}
          >
            {submitting ? "Deleting…" : "Delete set"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <p className="text-body-sm text-mute">
          {describeSetDeletion(set.name, set.kpiCount ?? 0, set.metricCount ?? 0)}
        </p>
        <Field label="Type the set name to confirm">
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={set.name}
            autoFocus
          />
        </Field>
      </div>
    </Modal>
  );
}

function SetStatusConfirmModal({
  set,
  status,
  submitting,
  onClose,
  onConfirm,
}: {
  set: StrategicSet;
  status: StrategicSetStatus;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Change set status"
      subtitle={set.name}
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
        Set this strategic set to <span className="font-medium capitalize text-on-surface">{status}</span>?
      </p>
    </Modal>
  );
}

function CreateSetModal({
  open,
  onClose,
  onCreate,
  sets,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    description?: string;
    startYear: number;
    cloneFromSetId?: number;
    cloneMode?: "categories" | "all";
    createdBy?: string;
  }) => void;
  sets: StrategicSet[];
  submitting: boolean;
}) {
  const { user } = useAuth();
  const thisBEYear = currentBEYear();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startYear, setStartYear] = useState(thisBEYear);
  const [cloneMode, setCloneMode] = useState<CloneMode>("empty");
  const [cloneFromSetId, setCloneFromSetId] = useState<string>("");
  const [typedPhrase, setTypedPhrase] = useState("");

  const canClone = sets.length > 0;

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setStartYear(thisBEYear);
      // Categories-only is the default whenever there is a set to clone from.
      setCloneMode(canClone ? "categories" : "empty");
      setCloneFromSetId("");
      setTypedPhrase("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const endYear = useMemo(() => startYear + 4, [startYear]);
  const cloning = cloneMode !== "empty";
  const source = sets.find((s) => String(s.id) === cloneFromSetId);
  const cloneReady = !cloning || (source !== undefined && cloneConfirmed(typedPhrase));
  const valid = name.trim().length > 1 && Number.isInteger(startYear) && cloneReady;

  const modeOptions: RadioOption<CloneMode>[] = [
    {
      value: "empty",
      label: "Start empty",
      hint: "Seeds the default categories, no KPIs",
    },
    ...(canClone
      ? [
          {
            value: "categories" as const,
            label: "Clone categories only",
            hint: "Copies a set's categories, no KPIs",
          },
          {
            value: "all" as const,
            label: "Clone everything",
            hint: "Categories, KPIs, sub-KPIs and targets",
          },
        ]
      : []),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Strategic Set"
      subtitle="A 5-year template. Clone a previous set to carry over its categories, or everything."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() =>
              onCreate({
                name: name.trim(),
                description: description.trim() || undefined,
                startYear,
                ...(cloning && source
                  ? { cloneFromSetId: source.id, cloneMode }
                  : {}),
                createdBy: user?.email,
              })
            }
          >
            {submitting ? "Creating…" : "Create Set"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="Set Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. SHS Strategic Set 2568–2572"
          />
        </Field>
        <Field label="Description" hint="Optional">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary of this strategic period"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="Start Year (B.E.)">
            <Input
              type="number"
              min={2400}
              max={2700}
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
            />
          </Field>
          <Field label="End Year" hint="Auto-calculated (start + 4)">
            <Input value={String(endYear)} readOnly disabled />
          </Field>
        </div>

        <div className="flex flex-col gap-xs">
          <span className="text-label-md text-on-surface">Starting content</span>
          <RadioGroup
            name="clone-mode"
            value={cloneMode}
            options={modeOptions}
            onChange={(mode) => {
              setCloneMode(mode);
              // A new choice needs a fresh confirmation.
              setTypedPhrase("");
            }}
          />
        </div>

        {cloning && (
          <Field label="Clone from">
            <Select
              value={cloneFromSetId}
              onChange={(e) => {
                setCloneFromSetId(e.target.value);
                setTypedPhrase("");
              }}
            >
              <option value="" disabled>
                Choose a set…
              </option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startYear}–{s.endYear})
                </option>
              ))}
            </Select>
          </Field>
        )}

        {cloning && source && (
          <div className="flex flex-col gap-md rounded border border-hairline bg-surface-soft p-md">
            <p className="text-body-sm text-mute">{describeClone(cloneMode, source.name)}</p>
            <Field label={`Type "${CLONE_CONFIRM_PHRASE}" to continue`}>
              <Input
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                placeholder={CLONE_CONFIRM_PHRASE}
              />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
