"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Select,
  UnitSelect,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
  ActionMenu,
  useConfirm,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import {
  useStrategicSet,
  useLibraryKpis,
  useCreateLibraryKpi,
  useDeleteLibraryKpi,
  useKpiCategories,
  useKpiTypes,
  useCommittees,
} from "@/lib/data/hooks";
import {
  KPI_TYPES,
  type KpiType,
  type LibraryKpi,
} from "@/lib/types";
import { categoriesOfType } from "@/lib/kpi/categories";
import { describeKpiDeletion } from "@/lib/kpi/deletion";
import { ManageCategoriesModal } from "./ManageCategoriesModal";

// Keyed on the seeded ids; kpi_type is user-extensible now, so unknown ids fall
// back to a neutral tone rather than rendering undefined.
const TYPE_TONE: Record<string, "primary" | "info" | "neutral"> = {
  strategic: "primary",
  operational: "info",
  routine: "neutral",
};
type SortKey = "name" | "type";
type SortState = { key: SortKey; dir: "asc" | "desc" };

export default function SetDetailPage() {
  return (
    <RequirePermission action="configure_kpis">
      <SetDetail />
    </RequirePermission>
  );
}

function SetDetail() {
  const router = useRouter();
  const params = useParams<{ setId: string }>();
  const setId = Number(params.setId);

  const setQ = useStrategicSet(setId);
  const kpisQ = useLibraryKpis(setId);
  const categoriesQ = useKpiCategories(setId);
  const kpiTypesQ = useKpiTypes();
  const committeesQ = useCommittees();
  const create = useCreateLibraryKpi();
  const del = useDeleteLibraryKpi(setId);
  const confirm = useConfirm();

  // Show the set's name (not its id) in the breadcrumb.
  useBreadcrumbLabel(`/kpi-management/library/${setId}`, setQ.data?.name);

  const [cat, setCat] = useState<string>("all");
  const [committeeFilter, setCommitteeFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortState | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showManageCats, setShowManageCats] = useState(false);

  const categories = categoriesQ.data ?? [];
  const kpis = kpisQ.data ?? [];
  const kpiTypes = useMemo(() => kpiTypesQ.data ?? [], [kpiTypesQ.data]);
  const committees = committeesQ.data ?? [];
  // Tabs group by category_id, which holds the Strategic taxonomy only —
  // routine categories would otherwise show up as permanently-empty tabs.
  const strategicCategories = categoriesOfType(categories, "strategic");
  const typeLabel = (id: string) =>
    kpiTypes.find((t) => t.id === id)?.kpiTypeName ??
    KPI_TYPES.find((t) => t.id === id)?.label ??
    id;

  // Committee narrows the KPI pool first; the category tabs (and their
  // counts) operate on that narrowed set, same as the dashboard's KPI-type
  // toggle scopes its group tabs.
  const committeeScoped =
    committeeFilter === "all"
      ? kpis
      : kpis.filter((k) => k.committeeId === committeeFilter);

  const tabs = [
    { id: "all", label: "All", count: committeeScoped.length },
    ...strategicCategories.map((c) => ({
      id: c.id,
      label: c.label,
      count: committeeScoped.filter((k) => k.categoryId === c.id).length,
    })),
  ];

  const rows = useMemo(
    () =>
      cat === "all"
        ? committeeScoped
        : committeeScoped.filter((k) => k.categoryId === cat),
    [committeeScoped, cat],
  );
  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    const valueFor = (kpi: (typeof rows)[number]): string | number => {
      if (sort.key === "name") return kpi.name;

      // Match the Performance table: type order is admin-configurable and is
      // therefore more meaningful than alphabetical ids or labels.
      return kpiTypes.find((type) => type.id === kpi.kpiType)?.sortOrder ?? 99;
    };

    return [...rows].sort((left, right) => {
      const leftValue = valueFor(left);
      const rightValue = valueFor(right);
      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), undefined, {
              sensitivity: "base",
              numeric: true,
            });
      return sort.dir === "asc" ? comparison : -comparison;
    });
  }, [rows, sort, kpiTypes]);
  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current?.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  const set = setQ.data;

  // No usage pre-check: the API refuses with a 409 when an active record holds
  // recorded progress, and jsonOrThrow surfaces that message in the error
  // toast. Same shape as the sub-KPI delete in MetricEditor.
  const askDelete = async (k: LibraryKpi) => {
    if (
      await confirm({
        title: "Delete KPI",
        message: describeKpiDeletion(k.name, k.metricCount ?? 0),
        confirmLabel: "Delete",
        confirmPhrase: "DELETE",
      })
    ) {
      del.mutate(k.id);
    }
  };

  return (
    <>
      <PageHeader
        title={set ? set.name : "Strategic Set"}
        description={
          set
            ? `${set.startYear}–${set.endYear} · ${set.status}`
            : "Loading…"
        }
        actions={
          <>
            <Button
              variant="ghost"
              icon="arrow_back"
              onClick={() => router.push("/kpi-management/library")}
            >
              All Sets
            </Button>
            <Button icon="add" onClick={() => setShowCreate(true)}>
              Add KPI
            </Button>
            <Button
              variant="ghost"
              icon="category"
              onClick={() => setShowManageCats(true)}
            >
              Manage Categories
            </Button>
          </>
        }
      />

      <div className="flex items-end gap-md">
        <Field label="Committee">
          <Select
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
            className="w-auto min-w-[200px]"
          >
            <option value="all">All Committees</option>
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Tabs items={tabs} active={cat} onChange={setCat} variant="filled" />

      <Card className="overflow-hidden">
        <QueryBoundary isLoading={kpisQ.isLoading} isError={kpisQ.isError}>
          {rows.length === 0 ? (
            <EmptyState
              title="No KPIs here yet"
              message="Add a KPI to this strategic set to begin defining targets and sub-KPIs."
              action={
                <Button icon="add" onClick={() => setShowCreate(true)}>
                  Add KPI
                </Button>
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th
                    sortable
                    sortDir={sort?.key === "name" ? sort.dir : null}
                    onSort={() => toggleSort("name")}
                  >
                    KPI Name
                  </Th>
                  <Th
                    sortable
                    sortDir={sort?.key === "type" ? sort.dir : null}
                    onSort={() => toggleSort("type")}
                    align="center"
                  >
                    Type
                  </Th>
                  <Th align="center">Weight</Th>
                  <Th align="center">Sub-KPIs</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((k) => (
                  <Tr
                    key={k.id}
                    onClick={() =>
                      router.push(`/kpi-management/library/${setId}/kpis/${k.id}`)
                    }
                  >
                    <Td className="font-medium">{k.name}</Td>
                    <Td align="center">
                      <Badge tone={TYPE_TONE[k.kpiType] ?? "neutral"}>
                        {typeLabel(k.kpiType)}
                      </Badge>
                    </Td>
                    <Td align="center">{k.weight}%</Td>
                    <Td align="center">{k.metricCount ?? 0}</Td>
                    {/* The whole cell stops propagation so the row's own
                        navigate-on-click can't fire behind the menu. */}
                    <Td align="right" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        label={`Actions for ${k.name}`}
                        items={[
                          {
                            icon: "tune",
                            label: "Configure",
                            onSelect: () =>
                              router.push(`/kpi-management/library/${setId}/kpis/${k.id}`),
                          },
                          {
                            icon: "delete",
                            label: "Delete",
                            tone: "danger",
                            onSelect: () => askDelete(k),
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      <CreateKpiModal
        open={showCreate}
        submitting={create.isPending}
        categories={strategicCategories}
        kpiTypes={kpiTypes.map((t) => ({ id: t.id, label: t.kpiTypeName }))}
        onClose={() => setShowCreate(false)}
        onCreate={(input) =>
          create.mutate(
            { setId, ...input },
            {
              onSuccess: (created) => {
                setShowCreate(false);
                router.push(
                  `/kpi-management/library/${setId}/kpis/${(created as LibraryKpi).id}`,
                );
              },
            },
          )
        }
      />

      <ManageCategoriesModal
        open={showManageCats}
        onClose={() => setShowManageCats(false)}
        setId={setId}
        categories={categories}
        kpiCountFor={(id) =>
          // Either taxonomy counts as "in use" — a Routine category is
          // referenced through routineCategoryId, not categoryId.
          kpis.filter((k) => k.categoryId === id || k.routineCategoryId === id).length
        }
      />
    </>
  );
}

function CreateKpiModal({
  open,
  onClose,
  onCreate,
  categories,
  kpiTypes,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    categoryId: string | null;
    kpiType: KpiType;
    weight: number;
    unit: string;
  }) => void;
  categories: { id: string; label: string }[];
  kpiTypes: { id: string; label: string }[];
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [kpiType, setKpiType] = useState<KpiType>("operational");
  const [weight, setWeight] = useState(10);
  const [unit, setUnit] = useState("Item");

  useEffect(() => {
    if (open) {
      setName("");
      setCategoryId("");
      setKpiType("operational");
      setWeight(10);
      setUnit("Item");
    }
  }, [open]);

  const valid = name.trim().length > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add KPI"
      subtitle="Define the indicator; configure targets, calculation logic and sub-KPIs next."
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
                categoryId: categoryId || null,
                kpiType,
                weight,
                unit,
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
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Clinical Placement Rate"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="KPI Type">
            <Select value={kpiType} onChange={(e) => setKpiType(e.target.value as KpiType)}>
              {(kpiTypes.length > 0 ? kpiTypes : KPI_TYPES).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
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
            <UnitSelect value={unit} onChange={setUnit} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
