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
  Button,
  Select,
  SearchInput,
  Badge,
  QueryBoundary,
  Field,
} from "@/components/ui";
import { RequirePermission } from "@/components/shell/Guard";
import { useFaculty, useDepartments } from "@/lib/data/hooks";
import { toCsv, downloadCsv } from "@/lib/csv";

const COLUMNS = [
  { id: "name", label: "Name" },
  { id: "department", label: "Department" },
  { id: "rank", label: "Rank" },
  { id: "tenureStatus", label: "Tenure" },
  { id: "kpiFocus", label: "KPI Focus" },
  { id: "researchScore", label: "Research Score" },
  { id: "status", label: "Status" },
] as const;

export default function ExportPage() {
  return (
    <RequirePermission action="manage_faculty">
      <ExportWorkflow />
    </RequirePermission>
  );
}

function ExportWorkflow() {
  const faculty = useFaculty();
  const departments = useDepartments();

  const [dept, setDept] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cols, setCols] = useState<Set<string>>(
    new Set(COLUMNS.map((c) => c.id)),
  );

  const deptName = (id: string) =>
    departments.data?.find((d) => d.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    let list = faculty.data ?? [];
    if (dept !== "all") list = list.filter((f) => f.departmentId === dept);
    if (q.trim())
      list = list.filter((f) =>
        f.name.toLowerCase().includes(q.trim().toLowerCase()),
      );
    return list;
  }, [faculty.data, dept, q]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleCol = (id: string) =>
    setCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedCount = rows.filter((r) => selected.has(r.id)).length;

  const generate = () => {
    const chosen = rows.filter((r) => selected.has(r.id));
    const activeCols = COLUMNS.filter((c) => cols.has(c.id));
    const headers = activeCols.map((c) => c.label);
    const data = chosen.map((f) =>
      activeCols.map((c) =>
        c.id === "department" ? deptName(f.departmentId) : (f as any)[c.id],
      ),
    );
    downloadCsv(`faculty-roster-${Date.now()}.csv`, toCsv(headers, data));
  };

  return (
    <>
      <PageHeader
        title="Global Roster Export"
        description="Select faculty and columns, then generate a CSV export."
      />

      <QueryBoundary
        isLoading={faculty.isLoading || departments.isLoading}
        isError={faculty.isError}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-xl">
          <Card className="overflow-hidden h-fit">
            <div className="flex flex-wrap items-center gap-md border-b border-hairline p-lg">
              <div className="min-w-[200px] flex-1">
                <SearchInput
                  placeholder="Search by name…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-auto min-w-[170px]"
              >
                <option value="all">All Departments</option>
                {departments.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {allSelected ? "Clear page" : "Select all"}
              </Button>
            </div>

            <Table>
              <thead>
                <tr>
                  <Th className="w-[44px]">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="accent-primary-container h-4 w-4"
                    />
                  </Th>
                  <Th>Name / ID</Th>
                  <Th>Department</Th>
                  <Th>Tenure</Th>
                  <Th align="right">Score</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <Tr key={f.id} onClick={() => toggleRow(f.id)}>
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${f.name}`}
                        checked={selected.has(f.id)}
                        onChange={() => toggleRow(f.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-primary-container h-4 w-4"
                      />
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-medium">{f.name}</span>
                        <span className="text-caption-sm text-mute">{f.id}</span>
                      </div>
                    </Td>
                    <Td className="text-mute">{deptName(f.departmentId)}</Td>
                    <Td>{f.tenureStatus}</Td>
                    <Td align="right" className="font-medium">
                      {f.researchScore}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <Card className="h-fit lg:sticky lg:top-[88px]">
            <CardHeader title="Export Options" />
            <div className="p-lg flex flex-col gap-lg">
              <div className="flex items-center justify-between rounded-lg bg-surface-soft px-md py-sm">
                <span className="text-body-sm text-mute">Selected</span>
                <Badge tone="primary">{selectedCount} rows</Badge>
              </div>

              <Field label="Columns">
                <div className="flex flex-col gap-xs">
                  {COLUMNS.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-sm text-body-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={cols.has(c.id)}
                        onChange={() => toggleCol(c.id)}
                        className="accent-primary-container h-4 w-4"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </Field>

              <Button
                icon="bolt"
                disabled={selectedCount === 0 || cols.size === 0}
                onClick={generate}
                className="w-full"
              >
                Generate Export
              </Button>
              <p className="text-caption-sm text-mute">
                Downloads a CSV of the {selectedCount} selected rows with{" "}
                {cols.size} columns.
              </p>
            </div>
          </Card>
        </div>
      </QueryBoundary>
    </>
  );
}
