"use client";

import { useMemo, useState } from "react";
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
  QueryBoundary,
  EmptyState,
} from "@/components/ui";
import { useCommitteeMemberships } from "@/lib/data/hooks";

type SortKey = "facultyName" | "committeeName";

export default function FacultyPage() {
  const memberships = useCommitteeMemberships();

  const [q, setQ] = useState("");
  const [committee, setCommittee] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "facultyName",
    dir: "asc",
  });
  const [page, setPage] = useState(0);

  const pageSize = 8;

  const committeeOptions = useMemo(() => {
    const names = new Set((memberships.data ?? []).map((m) => m.committeeName));
    return Array.from(names).sort();
  }, [memberships.data]);

  const filtered = useMemo(() => {
    let list = memberships.data ?? [];
    if (q.trim())
      list = list.filter((m) =>
        m.facultyName.toLowerCase().includes(q.trim().toLowerCase()),
      );
    if (committee !== "all") list = list.filter((m) => m.committeeName === committee);
    list = [...list].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      return a[sort.key].localeCompare(b[sort.key]) * dir;
    });
    return list;
  }, [memberships.data, q, committee, sort]);

  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  const total = memberships.data?.length ?? 0;
  const committeesRepresented = new Set((memberships.data ?? []).map((m) => m.committeeId)).size;

  return (
    <>
      <PageHeader
        title="Faculty Roster"
        description="Committee assignments across all Health Sciences Committees."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <StatCard label="Total Memberships" value={total} icon="groups" />
        <StatCard label="Committees Represented" value={committeesRepresented} icon="account_tree" />
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
            {committeeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        <QueryBoundary isLoading={memberships.isLoading} isError={memberships.isError}>
          {filtered.length === 0 ? (
            <EmptyState
              title="No committee memberships yet"
              message="Assign faculty to committees from the Committees page."
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th sortable sortDir={sort.key === "facultyName" ? sort.dir : null} onSort={() => toggleSort("facultyName")}>
                      Faculty Member
                    </Th>
                    <Th sortable sortDir={sort.key === "committeeName" ? sort.dir : null} onSort={() => toggleSort("committeeName")}>
                      Committee
                    </Th>
                    <Th>Position</Th>
                    <Th>Primary KPI Focus</Th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((m) => (
                    <Tr key={`${m.facultyId}-${m.committeeId}`}>
                      <Td className="font-medium">{m.facultyName}</Td>
                      <Td className="text-mute">{m.committeeName}</Td>
                      <Td>{m.position}</Td>
                      <Td>
                        <Badge tone="neutral">{m.kpiFocus}</Badge>
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
    </>
  );
}
