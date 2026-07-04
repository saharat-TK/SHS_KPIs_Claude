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
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useStrategicSets, useCreateStrategicSet } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import type { StrategicSet, StrategicSetStatus } from "@/lib/types";

const STATUS_TONE: Record<StrategicSetStatus, "neutral" | "success" | "warning"> = {
  draft: "neutral",
  active: "success",
  archived: "warning",
};

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
  const [showCreate, setShowCreate] = useState(false);

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

      <Card className="overflow-hidden">
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
                    <Td align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconRight="chevron_right"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/kpi-management/library/${s.id}`);
                        }}
                      >
                        Open
                      </Button>
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
    </>
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
    createdBy?: string;
  }) => void;
  sets: StrategicSet[];
  submitting: boolean;
}) {
  const { user } = useAuth();
  const currentBEYear = new Date().getFullYear() + 543;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startYear, setStartYear] = useState(currentBEYear);
  const [cloneFromSetId, setCloneFromSetId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setStartYear(currentBEYear);
      setCloneFromSetId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const endYear = useMemo(() => startYear + 4, [startYear]);
  const valid = name.trim().length > 1 && Number.isInteger(startYear);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Strategic Set"
      subtitle="A 5-year template. Clone a previous set to carry over its KPIs and targets."
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
                cloneFromSetId: cloneFromSetId ? Number(cloneFromSetId) : undefined,
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
        {sets.length > 0 && (
          <Field
            label="Clone from existing set"
            hint="Copies all KPIs, sub-KPIs and targets from the chosen set"
          >
            <Select
              value={cloneFromSetId}
              onChange={(e) => setCloneFromSetId(e.target.value)}
            >
              <option value="">Start empty</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startYear}–{s.endYear})
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
    </Modal>
  );
}
