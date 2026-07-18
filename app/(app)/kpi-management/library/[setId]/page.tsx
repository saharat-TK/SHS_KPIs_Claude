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
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useBreadcrumbLabel } from "@/components/shell/BreadcrumbLabels";
import {
  useStrategicSet,
  useLibraryKpis,
  useCreateLibraryKpi,
  useKpiCategories,
} from "@/lib/data/hooks";
import {
  KPI_TYPES,
  type KpiType,
  type LibraryKpi,
} from "@/lib/types";
import { ManageCategoriesModal } from "./ManageCategoriesModal";

const TYPE_TONE: Record<KpiType, "primary" | "info" | "neutral"> = {
  strategic: "primary",
  operational: "info",
  routine: "neutral",
};

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
  const create = useCreateLibraryKpi();

  // Show the set's name (not its id) in the breadcrumb.
  useBreadcrumbLabel(`/kpi-management/library/${setId}`, setQ.data?.name);

  const [cat, setCat] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showManageCats, setShowManageCats] = useState(false);

  const categories = categoriesQ.data ?? [];
  const kpis = kpisQ.data ?? [];

  const tabs = [
    { id: "all", label: "All", count: kpis.length },
    ...categories.map((c) => ({
      id: c.id,
      label: c.label,
      count: kpis.filter((k) => k.categoryId === c.id).length,
    })),
  ];

  const rows = useMemo(
    () => (cat === "all" ? kpis : kpis.filter((k) => k.categoryId === cat)),
    [kpis, cat],
  );

  const set = setQ.data;

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

      <Tabs items={tabs} active={cat} onChange={setCat} />

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
                  <Th>KPI Name</Th>
                  <Th align="center">Type</Th>
                  <Th align="center">Weight</Th>
                  <Th align="center">Sub-KPIs</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => (
                  <Tr
                    key={k.id}
                    onClick={() =>
                      router.push(`/kpi-management/library/${setId}/kpis/${k.id}`)
                    }
                  >
                    <Td className="font-medium">{k.name}</Td>
                    <Td align="center">
                      <Badge tone={TYPE_TONE[k.kpiType]}>{k.kpiType}</Badge>
                    </Td>
                    <Td align="center">{k.weight}%</Td>
                    <Td align="center">{k.metricCount ?? 0}</Td>
                    <Td align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconRight="chevron_right"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/kpi-management/library/${setId}/kpis/${k.id}`);
                        }}
                      >
                        Configure
                      </Button>
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
        categories={categories}
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
        kpiCountFor={(id) => kpis.filter((k) => k.categoryId === id).length}
      />
    </>
  );
}

function CreateKpiModal({
  open,
  onClose,
  onCreate,
  categories,
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
              {KPI_TYPES.map((t) => (
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
