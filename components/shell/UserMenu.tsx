"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_LABELS } from "@/lib/auth/can";
import { useCommitteeMemberships, useFacultyRecords } from "@/lib/data/hooks";
import { signOutAction } from "@/app/(app)/actions";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { BASE_PATH } from "@/lib/basePath";

/** The committee position line under the name — the one genuinely useful
 *  detail the old persona switcher showed, kept as-is. */
function useMembershipDetail(facultyId: string | undefined) {
  const memberships = useCommitteeMemberships();
  const rows = memberships.data?.filter((m) => m.facultyId === facultyId) ?? [];
  if (memberships.isLoading && facultyId) return "Loading membership…";
  if (rows.length === 0) return null;
  return rows.map((m) => `${m.position} · ${m.committeeName}`).join(" / ");
}

export function UserMenu() {
  const { user, role, impersonating, realName, isRealAdmin } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const detail = useMembershipDetail(user.facultyId);

  // Only admins ever see the "View as" list, so only they pay for the query.
  const faculty = useFacultyRecords();
  const candidates = useMemo(() => {
    if (!isRealAdmin) return [];
    const q = query.trim().toLowerCase();
    return (faculty.data ?? [])
      .filter((f) => f.status === "active")
      .filter(
        (f) =>
          !q ||
          f.name.toLowerCase().includes(q) ||
          (f.email ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [faculty.data, query, isRealAdmin]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // router.refresh() is the point of the round-trip: the server layout
  // re-resolves the actor and re-renders. Flipping client state instead would
  // desync the UI from what the API actually authorizes.
  async function impersonate(facultyId: string) {
    setBusy(true);
    try {
      await fetch(`${BASE_PATH}/api/auth/impersonate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId }),
      });
      setOpen(false);
      setQuery("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-[36px] items-center gap-sm rounded-DEFAULT px-sm hover:bg-surface-soft transition-colors"
        title={impersonating ? `Viewing as ${user.name}` : user.email}
      >
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-caption-sm font-medium",
            impersonating
              ? "bg-warning text-black"
              : "bg-primary-container text-black font-semibold",
          )}
        >
          {user.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="max-w-[220px] truncate text-label-md text-on-surface font-medium">
            {user.name}
          </span>
          <span className="max-w-[220px] truncate text-caption-sm text-mute">
            {detail ?? ROLE_LABELS[role]}
          </span>
        </span>
        <Icon name="expand_more" size={18} className="text-stone" />
      </button>

      {open && (
        <div className="absolute right-0 mt-xs w-[300px] rounded-lg border border-hairline bg-surface-lowest shadow-chrome z-[60] py-xs">
          <div className="flex flex-col gap-tiny px-md py-sm">
            <p className="text-label-md text-on-surface">{user.name}</p>
            <p className="text-caption-sm text-mute">{user.email}</p>
            <p className="text-caption-sm text-mute">
              {ROLE_LABELS[role]}
              {detail ? ` · ${detail}` : ""}
            </p>
          </div>

          {isRealAdmin && (
            <>
              <div className="my-xs border-t border-hairline" />
              <p className="px-md py-xs text-utility-xs uppercase tracking-wider text-stone">
                View as
              </p>
              <div className="px-md pb-xs">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search faculty…"
                  className="h-[32px] w-full rounded-DEFAULT border border-hairline bg-surface-soft px-sm text-caption-sm text-on-surface outline-none focus:border-primary-dark"
                />
              </div>
              {candidates.map((f) => (
                <button
                  key={f.id}
                  disabled={busy}
                  onClick={() => impersonate(f.id)}
                  className="flex w-full flex-col items-start px-md py-xs text-left hover:bg-surface-soft transition-colors disabled:opacity-50"
                >
                  <span className="text-label-md text-on-surface">{f.name}</span>
                  <span className="text-caption-sm text-mute">
                    {ROLE_LABELS[f.systemRole]}
                    {f.email ? ` · ${f.email}` : ""}
                  </span>
                </button>
              ))}
              {candidates.length === 0 && (
                <p className="px-md py-xs text-caption-sm text-mute">
                  {faculty.isLoading ? "Loading…" : "No matches"}
                </p>
              )}
            </>
          )}

          <div className="my-xs border-t border-hairline" />
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-sm px-md py-sm text-left text-label-md text-on-surface hover:bg-surface-soft transition-colors"
            >
              <Icon name="logout" size={18} />
              Sign out
              {impersonating && (
                <span className="text-caption-sm text-mute">({realName})</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
