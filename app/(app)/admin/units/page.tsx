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
  SearchInput,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
} from "@/lib/data/hooks";
import type { UnitRecord } from "@/lib/types";

type Editing = UnitRecord | { isNew: true } | null;

export default function UnitsPage() {
  return (
    <RequirePermission action="configure_kpis">
      <UnitsManager />
    </RequirePermission>
  );
}

function UnitsManager() {
  const units = useUnits();
  const create = useCreateUnit();
  const update = useUpdateUnit();
  const del = useDeleteUnit();
  const confirm = useConfirm();

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const isMutating = create.isPending || update.isPending || del.isPending;

  const filtered = useMemo(() => {
    const list = units.data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (u) =>
        u.unitNameEn.toLowerCase().includes(needle) ||
        u.unitNameTh.toLowerCase().includes(needle) ||
        (u.description ?? "").toLowerCase().includes(needle),
    );
  }, [units.data, q]);

  return (
    <>
      <PageHeader
        title="Units"
        description="Manage the reference list of measurement units used by KPIs and metrics."
        actions={
          <Button icon="add" disabled={isMutating} onClick={() => setEditing({ isNew: true })}>
            Add Unit
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="p-lg">
          <SearchInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search units…"
            className="max-w-[320px]"
          />
        </div>

        <QueryBoundary isLoading={units.isLoading} isError={units.isError}>
          {filtered.length === 0 ? (
            <EmptyState
              icon="straighten"
              title="No units"
              message={
                q.trim()
                  ? "No units match your search."
                  : "Add your first measurement unit to get started."
              }
              action={
                q.trim() ? undefined : (
                  <Button icon="add" disabled={isMutating} onClick={() => setEditing({ isNew: true })}>
                    Add Unit
                  </Button>
                )
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>English Name</Th>
                  <Th>Thai Name</Th>
                  <Th>Description</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-medium">{u.unitNameEn}</Td>
                    <Td>{u.unitNameTh}</Td>
                    <Td className="text-mute">{u.description ?? "—"}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-xs">
                        <button
                          aria-label="Edit unit"
                          title="Edit unit"
                          disabled={isMutating}
                          className="text-mute hover:text-on-surface p-xs rounded hover:bg-surface-soft disabled:opacity-50"
                          onClick={() => setEditing(u)}
                        >
                          <Icon name="edit" size={18} />
                        </button>
                        <button
                          aria-label="Remove unit"
                          title="Remove unit"
                          disabled={del.isPending}
                          className="text-mute hover:text-error p-xs rounded hover:bg-surface-soft disabled:opacity-50"
                          onClick={async () => {
                            if (
                              await confirm({
                                title: "Delete unit",
                                message: `Delete unit "${u.unitNameEn}"? This can't be undone.`,
                                confirmLabel: "Delete",
                              })
                            ) {
                              del.mutate(u.id);
                            }
                          }}
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      {editing && (
        <UnitModal
          editing={editing}
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
              create.mutate(payload, { onSuccess: () => setEditing(null) });
            }
          }}
        />
      )}
    </>
  );
}

function UnitModal({
  editing,
  onClose,
  onSave,
  submitting,
  error,
}: {
  editing: Editing;
  onClose: () => void;
  onSave: (
    payload:
      | { id: number; unitNameTh: string; unitNameEn: string; description: string }
      | { unitNameTh: string; unitNameEn: string; description: string },
  ) => void;
  submitting: boolean;
  error?: string;
}) {
  const existing = editing && "id" in editing ? editing : null;
  const [unitNameEn, setUnitNameEn] = useState(existing?.unitNameEn ?? "");
  const [unitNameTh, setUnitNameTh] = useState(existing?.unitNameTh ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");

  const valid = unitNameEn.trim().length > 0 && unitNameTh.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? "Edit Unit" : "Add Unit"}
      subtitle="A measurement unit with its Thai and English names."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() => {
              const base = {
                unitNameTh: unitNameTh.trim(),
                unitNameEn: unitNameEn.trim(),
                description: description.trim(),
              };
              onSave(existing ? { ...base, id: existing.id } : base);
            }}
          >
            {submitting ? "Saving…" : existing ? "Save Changes" : "Add Unit"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="English Name">
            <Input
              value={unitNameEn}
              onChange={(e) => setUnitNameEn(e.target.value)}
              placeholder="e.g. Percent"
            />
          </Field>
          <Field label="Thai Name">
            <Input
              value={unitNameTh}
              onChange={(e) => setUnitNameTh(e.target.value)}
              placeholder="เช่น ร้อยละ"
            />
          </Field>
        </div>
        <Field label="Description" hint="Optional">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this unit"
          />
        </Field>
      </div>
    </Modal>
  );
}
