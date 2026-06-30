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
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useDepartments, useFaculty } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn, formatNumber } from "@/lib/utils";

export default function DepartmentsPage() {
  const { can } = useAuth();
  const departments = useDepartments();
  const faculty = useFaculty();
  const [selected, setSelected] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of faculty.data ?? [])
      m.set(f.departmentId, (m.get(f.departmentId) ?? 0) + 1);
    return m;
  }, [faculty.data]);

  const activeId = selected ?? departments.data?.[0]?.id ?? null;
  const activeDept = departments.data?.find((d) => d.id === activeId);
  const deptFaculty = (faculty.data ?? []).filter(
    (f) => f.departmentId === activeId,
  );

  return (
    <>
      <PageHeader
        title="Departments & Faculties"
        description="Organizational structure of the School of Health Sciences."
        actions={
          can("manage_faculty") && (
            <Button icon="add" variant="outline">
              Add Department
            </Button>
          )
        }
      />

      <QueryBoundary
        isLoading={departments.isLoading || faculty.isLoading}
        isError={departments.isError}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-xl">
          <div className="flex flex-col gap-sm">
            {departments.data?.map((d) => {
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
            {!activeDept ? (
              <EmptyState title="Select a department" />
            ) : (
              <>
                <CardHeader
                  title={activeDept.name}
                  subtitle={`${activeDept.faculty} · Key metric: ${activeDept.keyMetric}`}
                  actions={
                    <Badge tone="primary">
                      {deptFaculty.length} members
                    </Badge>
                  }
                />
                {deptFaculty.length === 0 ? (
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
                      {deptFaculty.map((f) => (
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
    </>
  );
}
