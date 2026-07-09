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
  Tabs,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  Select,
  ThresholdBar,
  HEALTH_LABEL,
  healthOf,
  useConfirm,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useKpis,
  useMetrics,
  useCreateKpi,
  useKpiCategories,
  useCreateKpiCategory,
  useUpdateKpiCategory,
  useDeleteKpiCategory,
  useReorderKpiCategories,
} from "@/lib/data/hooks";
import {
  KPI_CATEGORIES,
  type KpiCategory,
  type KpiCategoryRecord,
} from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { cn, formatNumber } from "@/lib/utils";

export default function KpisPage() {
  return (
    <RequirePermission action="configure_kpis">
      <KpiManagement />
    </RequirePermission>
  );
}

function KpiManagement() {
  const router = useRouter();
  const kpis = useKpis();
  const metrics = useMetrics();
  const categoriesQ = useKpiCategories();
  const create = useCreateKpi();
  const [cat, setCat] = useState<KpiCategory>("");
  const [showCreate, setShowCreate] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Fall back to the canonical const while the DB query loads, so tabs never
  // render empty. Records carry description/sortOrder; the fallback is id+label.
  const categories: { id: string; label: string }[] =
    categoriesQ.data ?? KPI_CATEGORIES;

  // Keep the active tab valid even if the selected category is deleted/renamed.
  const activeCat =
    cat && categories.some((c) => c.id === cat) ? cat : categories[0]?.id ?? "";

  const tabs = categories.map((c) => ({
    id: c.id,
    label: c.label,
    count: (kpis.data ?? []).filter((k) => k.category === c.id).length,
  }));

  const rows = useMemo(
    () => (kpis.data ?? []).filter((k) => k.category === activeCat),
    [kpis.data, activeCat],
  );

  const subCount = (kpiId: string) =>
    (metrics.data ?? []).filter((m) => m.kpiId === kpiId).length;

  return (
    <>
      <PageHeader
        title="KPI Management"
        description="Configure key performance indicators, their sub-KPIs, weights and thresholds."
        actions={
          <>
            <Button icon="add" onClick={() => setShowCreate(true)}>
              Create New KPI
            </Button>
            <Button
              variant="ghost"
              icon="category"
              onClick={() => setShowCategories(true)}
            >
              Manage Categories
            </Button>
          </>
        }
      />

      <Tabs
        items={tabs}
        active={activeCat}
        onChange={(id) => setCat(id as KpiCategory)}
      />

      <Card className="overflow-hidden">
        <QueryBoundary isLoading={kpis.isLoading} isError={kpis.isError}>
          {rows.length === 0 ? (
            <EmptyState
              title="No KPIs in this category"
              message="Create one to start tracking this category."
              action={
                <Button icon="add" onClick={() => setShowCreate(true)}>
                  Create New KPI
                </Button>
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Metric Name</Th>
                  <Th align="center">Weight</Th>
                  <Th align="center">Sub-KPIs</Th>
                  <Th align="right">Current Value</Th>
                  <Th>Health</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => {
                  const health = healthOf(k.currentValue, k.thresholds);
                  return (
                    <Tr key={k.id} onClick={() => router.push(`/kpis/${k.id}`)}>
                      <Td className="font-medium">{k.name}</Td>
                      <Td align="center">
                        <Badge tone="neutral">{k.weight}%</Badge>
                      </Td>
                      <Td align="center">{subCount(k.id)}</Td>
                      <Td align="right" className="font-medium">
                        {formatNumber(k.currentValue, 1)}
                        <span className="text-mute"> {k.unit}</span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-sm">
                          <ThresholdBar
                            value={k.currentValue}
                            thresholds={k.thresholds}
                            className="w-[90px]"
                          />
                          <span className="text-caption-sm text-mute">
                            {HEALTH_LABEL[health]}
                          </span>
                        </div>
                      </Td>
                      <Td align="right">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconRight="chevron_right"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/kpis/${k.id}`);
                          }}
                        >
                          Configure
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      <CreateKpiModal
        open={showCreate}
        categories={categories}
        defaultCategory={activeCat}
        submitting={create.isPending}
        onClose={() => setShowCreate(false)}
        onCreate={(input) =>
          create.mutate(input, {
            onSuccess: (k) => {
              setShowCreate(false);
              router.push(`/kpis/${k.id}`);
            },
          })
        }
      />

      <ManageCategoriesModal
        open={showCategories}
        onClose={() => setShowCategories(false)}
        categories={categoriesQ.data ?? []}
        kpiCountFor={(id) =>
          (kpis.data ?? []).filter((k) => k.category === id).length
        }
      />
    </>
  );
}

function ManageCategoriesModal({
  open,
  onClose,
  categories,
  kpiCountFor,
}: {
  open: boolean;
  onClose: () => void;
  categories: KpiCategoryRecord[];
  kpiCountFor: (id: string) => number;
}) {
  const createCat = useCreateKpiCategory();
  const reorderCat = useReorderKpiCategories();
  const [newLabel, setNewLabel] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const canAdd = newLabel.trim().length > 1;

  const addCategory = () => {
    if (!canAdd) return;
    createCat.mutate(
      { label: newLabel.trim() },
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
      subtitle="Rename, describe, reorder or remove KPI categories."
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
          <Button
            icon="add"
            disabled={!canAdd || createCat.isPending}
            onClick={addCategory}
          >
            {createCat.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CategoryRow({
  category,
  inUse,
  dragging,
  dragOver,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDrop,
}: {
  category: KpiCategoryRecord;
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

  const dirty =
    label.trim() !== category.label ||
    description.trim() !== (category.description ?? "");
  const canSave = dirty && label.trim().length > 1;

  const save = () => {
    if (!canSave) return;
    updateCat.mutate({
      id: category.id,
      patch: { label: label.trim(), description: description.trim() },
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
      <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-sm min-w-0">
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
        <span className="sr-only">
          {inUse} KPIs use this category; deletion blocked.
        </span>
      )}
    </div>
  );
}

function CreateKpiModal({
  open,
  onClose,
  onCreate,
  categories,
  defaultCategory,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: Parameters<ReturnType<typeof useCreateKpi>["mutate"]>[0]) => void;
  categories: { id: string; label: string }[];
  defaultCategory: KpiCategory;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<KpiCategory>(defaultCategory);
  const [weight, setWeight] = useState(25);
  const [unit, setUnit] = useState("%");
  const valid = name.trim().length > 1;

  // Sync the category default whenever the modal is opened (categories may have
  // loaded after this component first mounted).
  useEffect(() => {
    if (open) setCategory(defaultCategory);
  }, [open, defaultCategory]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New KPI"
      subtitle="Define the indicator; configure sub-KPIs and thresholds next."
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
                category,
                weight,
                unit,
                calculationMethod: "Manual entry",
                calculationType: "weighted_sum",
                currentValue: 0,
                thresholds: { green: 80, amber: 60 },
                committeeIds: [],
              })
            }
          >
            {submitting ? "Creating…" : "Create KPI"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="KPI Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Clinical Placement Rate" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as KpiCategory)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Weight (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </Field>
          <Field label="Unit">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
