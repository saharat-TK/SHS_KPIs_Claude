"use client";

import { useState } from "react";
import { Modal, Button, Field, Input, Select, useConfirm } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import {
  useCreateKpiCategory,
  useUpdateKpiCategory,
  useDeleteKpiCategory,
  useReorderKpiCategories,
  useKpiTypes,
} from "@/lib/data/hooks";
import type { KpiCategoryRecord, KpiTypeRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

// Set-scoped category manager. Reused by the strategic-set detail page (with a
// setId) and the prototype KPI Management page (global, no setId).
export function ManageCategoriesModal({
  open,
  onClose,
  categories,
  kpiCountFor,
  setId,
}: {
  open: boolean;
  onClose: () => void;
  categories: KpiCategoryRecord[];
  kpiCountFor: (id: string) => number;
  /** Owning strategic set; omitted → global categories. */
  setId?: number;
}) {
  const createCat = useCreateKpiCategory();
  const reorderCat = useReorderKpiCategories(setId);
  // Strategic / Routine only — Operational classifies KPIs, not categories.
  const kpiTypesQ = useKpiTypes({ forCategories: true });
  const kpiTypes = kpiTypesQ.data ?? [];
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("strategic");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const canAdd = newLabel.trim().length > 1;

  const addCategory = () => {
    if (!canAdd) return;
    createCat.mutate(
      { setId, label: newLabel.trim(), kpiType: newType },
      { onSuccess: () => setNewLabel("") },
    );
  };

  // Dropping on a row moves the dragged category to just before it.
  const handleDrop = (targetId: string) => {
    if (draggingId && draggingId !== targetId) {
      const ids = categories.map((c) => c.id).filter((id) => id !== draggingId);
      ids.splice(ids.indexOf(targetId), 0, draggingId);
      reorderCat.mutate(ids);
    }
    setDraggingId(null);
    setOverId(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Categories"
      subtitle="Rename, describe, retype, reorder or remove this set's KPI categories."
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-md">
        {categories.length === 0 ? (
          <p className="text-body-sm text-mute">No categories yet.</p>
        ) : (
          <div className="flex flex-col gap-sm">
            {categories.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                kpiTypes={kpiTypes}
                inUse={kpiCountFor(c.id)}
                dragging={draggingId === c.id}
                dragOver={overId === c.id && draggingId !== null && draggingId !== c.id}
                onDragStart={() => setDraggingId(c.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverId(null);
                }}
                onDragEnter={() => setOverId(c.id)}
                onDrop={() => handleDrop(c.id)}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-sm border-t border-hairline pt-md">
          <Field label="New category">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Community Engagement"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
          </Field>
          <div className="w-[150px] shrink-0">
            <Field label="Type">
              <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
                {kpiTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.kpiTypeName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button icon="add" disabled={!canAdd || createCat.isPending} onClick={addCategory}>
            {createCat.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CategoryRow({
  category,
  kpiTypes,
  inUse,
  dragging,
  dragOver,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDrop,
}: {
  category: KpiCategoryRecord;
  kpiTypes: KpiTypeRecord[];
  inUse: number;
  dragging: boolean;
  dragOver: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
}) {
  const updateCat = useUpdateKpiCategory();
  const deleteCat = useDeleteKpiCategory();
  const confirm = useConfirm();
  const [label, setLabel] = useState(category.label);
  const [description, setDescription] = useState(category.description ?? "");
  const [kpiType, setKpiType] = useState(category.kpiType);

  const dirty =
    label.trim() !== category.label ||
    description.trim() !== (category.description ?? "") ||
    kpiType !== category.kpiType;
  const canSave = dirty && label.trim().length > 1;

  const save = () => {
    if (!canSave) return;
    updateCat.mutate({
      id: category.id,
      patch: { label: label.trim(), description: description.trim(), kpiType },
    });
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        "flex items-start gap-sm rounded-DEFAULT px-md py-sm border-t-2 transition-colors",
        dragging ? "opacity-40" : "",
        dragOver ? "border-primary-container" : "border-transparent",
      )}
    >
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", category.id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        aria-label="Drag to reorder"
        title="Drag to reorder"
        className="mt-xs flex h-[30px] w-[20px] shrink-0 cursor-grab items-center justify-center text-mute active:cursor-grabbing"
      >
        <Icon name="drag_indicator" size={18} />
      </button>
      <div className="grid flex-1 grid-cols-1 sm:grid-cols-[1fr_1fr_150px] gap-sm min-w-0">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Category name"
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <Select
          value={kpiType}
          aria-label="Category type"
          onChange={(e) => setKpiType(e.target.value)}
        >
          {/* Guard against a row typed with something not in the list (e.g.
              while the types query is still in flight) silently retyping itself. */}
          {kpiTypes.some((t) => t.id === kpiType) ? null : (
            <option value={kpiType}>{kpiType}</option>
          )}
          {kpiTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.kpiTypeName}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-xs shrink-0">
        <Button
          variant="ghost"
          size="sm"
          icon="save"
          disabled={!canSave || updateCat.isPending}
          onClick={save}
        >
          Save
        </Button>
        <button
          aria-label="Remove category"
          title={
            inUse > 0
              ? `${inUse} KPI${inUse === 1 ? "" : "s"} still use this category`
              : "Remove category"
          }
          disabled={inUse > 0 || deleteCat.isPending}
          onClick={async () => {
            if (
              await confirm({
                title: "Remove category",
                message: `Remove category "${category.label}"? This can't be undone.`,
                confirmLabel: "Remove",
              })
            ) {
              deleteCat.mutate(category.id);
            }
          }}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-DEFAULT text-mute transition-colors enabled:hover:bg-error/10 enabled:hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="delete" size={18} />
        </button>
      </div>
      {inUse > 0 && (
        <span className="sr-only">{inUse} KPIs use this category; deletion blocked.</span>
      )}
    </div>
  );
}
