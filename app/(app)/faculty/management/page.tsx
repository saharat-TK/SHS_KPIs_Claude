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
  useConfirm,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { RequirePermission } from "@/components/shell/Guard";
import {
  useFacultyRecords,
  useCreateFacultyRecord,
  useUpdateFacultyRecord,
  useDeleteFacultyRecord,
} from "@/lib/data/hooks";
import type { EntityStatus, FacultyRecord, Program, Rank, SystemRole } from "@/lib/types";

const PROGRAMS: Program[] = ["BioMed", "EnvH", "OHS", "PH", "Sport Science", "SHS Office"];
const RANKS: Rank[] = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Support Staff"];

type SortKey = "name" | "rank" | "program";
type Editing = FacultyRecord | { isNew: true } | null;

export default function FacultyManagementPage() {
  return (
    <RequirePermission action="manage_faculty">
      <FacultyManagement />
    </RequirePermission>
  );
}

function FacultyManagement() {
  const faculty = useFacultyRecords();
  const create = useCreateFacultyRecord();
  const update = useUpdateFacultyRecord();
  const del = useDeleteFacultyRecord();
  const confirm = useConfirm();

  const [q, setQ] = useState("");
  const [program, setProgram] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Editing>(null);

  const pageSize = 8;

  const filtered = useMemo(() => {
    let list = faculty.data ?? [];
    if (q.trim())
      list = list.filter((f) =>
        f.name.toLowerCase().includes(q.trim().toLowerCase()),
      );
    if (program !== "all") list = list.filter((f) => f.program === program);
    list = [...list].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      return a[sort.key].localeCompare(b[sort.key]) * dir;
    });
    return list;
  }, [faculty.data, q, program, sort]);

  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  const total = faculty.data?.length ?? 0;
  const activeCount = faculty.data?.filter((f) => f.status === "active").length ?? 0;

  return (
    <>
      <PageHeader
        title="Faculty Management"
        description="Add, edit, and manage faculty member records — name, rank, contact details, program, and system access."
        actions={
          <>
            <Link href="/faculty/export">
              <Button variant="outline" icon="download">
                Export
              </Button>
            </Link>
            <Button icon="person_add" onClick={() => setEditing({ isNew: true })}>
              Add Faculty
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
        <StatCard label="Total Faculty" value={total} icon="groups" />
        <StatCard label="Active Faculty" value={activeCount} icon="verified" />
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
            value={program}
            onChange={(e) => {
              setProgram(e.target.value);
              setPage(0);
            }}
            className="w-auto min-w-[170px]"
          >
            <option value="all">All Programs</option>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        <QueryBoundary isLoading={faculty.isLoading} isError={faculty.isError}>
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
                    <Th sortable sortDir={sort.key === "rank" ? sort.dir : null} onSort={() => toggleSort("rank")}>
                      Rank
                    </Th>
                    <Th>Email</Th>
                    <Th>Name (TH)</Th>
                    <Th sortable sortDir={sort.key === "program" ? sort.dir : null} onSort={() => toggleSort("program")}>
                      Program
                    </Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((f) => (
                    <Tr key={f.id}>
                      <Td className="font-medium">{f.name}</Td>
                      <Td>{f.rank}</Td>
                      <Td className="text-mute">{f.email ?? "—"}</Td>
                      <Td className="text-mute">{f.nameTh ?? "—"}</Td>
                      <Td>{f.program}</Td>
                      <Td>
                        <StatusPill status={f.status} />
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-xs">
                          <button
                            aria-label="Edit faculty member"
                            className="text-mute hover:text-on-surface p-xs rounded hover:bg-surface-soft"
                            onClick={() => setEditing(f)}
                          >
                            <Icon name="edit" size={18} />
                          </button>
                          <button
                            aria-label="Remove faculty member"
                            className="text-mute hover:text-error p-xs rounded hover:bg-surface-soft"
                            onClick={async () => {
                              if (
                                await confirm({
                                  title: "Remove faculty member",
                                  message: `Remove "${f.name}" from the faculty roster? This can't be undone.`,
                                  confirmLabel: "Remove",
                                })
                              ) {
                                del.mutate(f.id);
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

      {editing && (
        <FacultyModal
          editing={editing}
          submitting={create.isPending || update.isPending}
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

function FacultyModal({
  editing,
  onClose,
  onSave,
  submitting,
}: {
  editing: Editing;
  onClose: () => void;
  onSave: (payload: FacultyRecord | Omit<FacultyRecord, "id">) => void;
  submitting: boolean;
}) {
  const existing = editing && "id" in editing ? editing : null;
  const [name, setName] = useState(existing?.name ?? "");
  const [rank, setRank] = useState<Rank>(existing?.rank ?? "Lecturer");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [nameTh, setNameTh] = useState(existing?.nameTh ?? "");
  const [program, setProgram] = useState<Program>(existing?.program ?? "BioMed");
  const [status, setStatus] = useState<EntityStatus>(existing?.status ?? "active");
  const [systemRole, setSystemRole] = useState<SystemRole>(existing?.systemRole ?? "user");

  const valid = name.trim().length > 1;

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? "Edit Faculty Member" : "Add Faculty Member"}
      subtitle="Update name, rank, contact details, program, status, and system role."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() => {
              const base = {
                name: name.trim(),
                rank,
                email: email.trim() || null,
                nameTh: nameTh.trim() || null,
                program,
                status,
                systemRole,
              };
              onSave(existing ? { ...base, id: existing.id } : base);
            }}
          >
            {submitting ? "Saving…" : existing ? "Save Changes" : "Add Faculty"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-lg">
        <Field label="Full Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. อ.ดร.นิเวศน์ กุลวงค์" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="Rank">
            <Select value={rank} onChange={(e) => setRank(e.target.value as Rank)}>
              {RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program">
            <Select value={program} onChange={(e) => setProgram(e.target.value as Program)}>
              {PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. name.sur@mfu.ac.th" />
          </Field>
          <Field label="Name (TH)">
            <Input value={nameTh} onChange={(e) => setNameTh(e.target.value)} placeholder="Thai-script name" />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as EntityStatus)}>
              {["active", "inactive", "draft"].map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="System Role">
            <Select value={systemRole} onChange={(e) => setSystemRole(e.target.value as SystemRole)}>
              {["admin", "user"].map((r) => (
                <option key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
