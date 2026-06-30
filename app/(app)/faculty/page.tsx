"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Badge,
  Button,
  SearchInput,
  Select,
  StatCard,
  StatusPill,
  QueryBoundary,
  EmptyState,
  Modal,
  Field,
  Input,
} from "@/components/ui";
import { useFaculty, useCommittees, useCreateFaculty } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/AuthContext";
import type { FacultyMember, Rank, TenureStatus } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type SortKey = "name" | "researchScore" | "rank";

export default function FacultyPage() {
  const { can } = useAuth();
  const faculty = useFaculty();
  const committees = useCommittees();
  const create = useCreateFaculty();

  const [q, setQ] = useState("");
  const [committee, setCommittee] = useState("all");
  const [tenure, setTenure] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);

  const pageSize = 8;
  const committeeName = (id: string) =>
    committees.data?.find((d) => d.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    let list = faculty.data ?? [];
    if (q.trim())
      list = list.filter((f) =>
        f.name.toLowerCase().includes(q.trim().toLowerCase()),
      );
    if (committee !== "all") list = list.filter((f) => f.committeeId === committee);
    if (tenure !== "all") list = list.filter((f) => f.tenureStatus === tenure);
    list = [...list].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "researchScore")
        return (a.researchScore - b.researchScore) * dir;
      return a[sort.key].localeCompare(b[sort.key]) * dir;
    });
    return list;
  }, [faculty.data, q, committee, tenure, sort]);

  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  const total = faculty.data?.length ?? 0;
  const tenured =
    faculty.data?.filter((f) => f.tenureStatus === "Tenured").length ?? 0;
  const avgScore = total
    ? (faculty.data!.reduce((s, f) => s + f.researchScore, 0) / total).toFixed(1)
    : "—";

  return (
    <>
      <PageHeader
        title="Faculty Roster"
        description="Global faculty directory across all Health Sciences Committees."
        actions={
          can("manage_faculty") && (
            <>
              <Link href="/faculty/export">
                <Button variant="outline" icon="download">
                  Export
                </Button>
              </Link>
              <Button icon="person_add" onClick={() => setShowAdd(true)}>
                Add Faculty
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
        <StatCard label="Total Faculty" value={total} icon="groups" />
        <StatCard
          label="Tenured Ratio"
          value={total ? `${Math.round((tenured / total) * 100)}%` : "—"}
          icon="verified"
        />
        <StatCard label="Avg Research Score" value={avgScore} icon="science" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-md border-b border-hairline p-lg">
          <div className="min-w-[220px] flex-1">
            <SearchInput
              placeholder="Search faculty by name…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <Select
            value={committee}
            onChange={(e) => {
              setCommittee(e.target.value);
              setPage(0);
            }}
            className="w-auto min-w-[170px]"
          >
            <option value="all">All Committees</option>
            {committees.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            value={tenure}
            onChange={(e) => {
              setTenure(e.target.value);
              setPage(0);
            }}
            className="w-auto min-w-[150px]"
          >
            <option value="all">All Tenure</option>
            {["Tenured", "Tenure-Track", "Non-Tenure", "Contract"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        <QueryBoundary
          isLoading={faculty.isLoading || committees.isLoading}
          isError={faculty.isError}
        >
          {filtered.length === 0 ? (
            <EmptyState
              title="No faculty match"
              message="Try clearing filters or adjusting your search."
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th sortable sortDir={sort.key === "name" ? sort.dir : null} onSort={() => toggleSort("name")}>
                      Faculty Member
                    </Th>
                    <Th>Committee</Th>
                    <Th sortable sortDir={sort.key === "rank" ? sort.dir : null} onSort={() => toggleSort("rank")}>
                      Rank / Tenure
                    </Th>
                    <Th>Primary KPI Focus</Th>
                    <Th align="right" sortable sortDir={sort.key === "researchScore" ? sort.dir : null} onSort={() => toggleSort("researchScore")}>
                      Research Score
                    </Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((f) => (
                    <Tr key={f.id}>
                      <Td className="font-medium">{f.name}</Td>
                      <Td className="text-mute">{committeeName(f.committeeId)}</Td>
                      <Td>
                        <div className="flex flex-col">
                          <span>{f.rank}</span>
                          <span className="text-caption-sm text-mute">{f.tenureStatus}</span>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone="neutral">{f.kpiFocus}</Badge>
                      </Td>
                      <Td align="right" className="font-medium">
                        {formatNumber(f.researchScore)}
                      </Td>
                      <Td>
                        <StatusPill status={f.status} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>

              <div className="flex items-center justify-between gap-md p-lg">
                <p className="text-caption-sm text-mute">
                  Showing {page * pageSize + 1}–
                  {Math.min((page + 1) * pageSize, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    icon="chevron_left"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  <span className="text-caption-sm text-mute">
                    {page + 1} / {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    iconRight="chevron_right"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </QueryBoundary>
      </Card>

      <AddFacultyModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        committees={(committees.data ?? []).map((d) => ({ id: d.id, name: d.name }))}
        submitting={create.isPending}
        onSubmit={(input) => create.mutate(input, { onSuccess: () => setShowAdd(false) })}
      />
    </>
  );
}

function AddFacultyModal({
  open,
  onClose,
  committees,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  committees: { id: string; name: string }[];
  onSubmit: (input: Omit<FacultyMember, "id">) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [committeeId, setCommitteeId] = useState(committees[0]?.id ?? "");
  const [rank, setRank] = useState<Rank>("Lecturer");
  const [tenureStatus, setTenureStatus] = useState<TenureStatus>("Tenure-Track");

  const valid = name.trim().length > 1 && committeeId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Faculty Member"
      subtitle="Create a new roster entry (stored in-session for this prototype)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() =>
              onSubmit({
                name: name.startsWith("Dr.") ? name : `Dr. ${name}`,
                committeeId,
                rank,
                tenureStatus,
                kpiFocus: "Student Success",
                researchScore: 70,
                status: "active",
              })
            }
          >
            {submitting ? "Saving…" : "Add Faculty"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="Full Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pim Srisai" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="Committee">
            <Select value={committeeId} onChange={(e) => setCommitteeId(e.target.value)}>
              {committees.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rank">
            <Select value={rank} onChange={(e) => setRank(e.target.value as Rank)}>
              {["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Instructor"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Tenure Status">
          <Select value={tenureStatus} onChange={(e) => setTenureStatus(e.target.value as TenureStatus)}>
            {["Tenured", "Tenure-Track", "Non-Tenure", "Contract"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
