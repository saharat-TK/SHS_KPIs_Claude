"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_LABELS } from "@/lib/auth/can";
import type { Role } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["admin", "reviewer", "department", "viewer"];

export function RoleSwitcher() {
  const { user, role, setRole } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-[36px] items-center gap-sm rounded-DEFAULT border border-hairline bg-surface-lowest px-md hover:border-hairline-strong transition-colors"
        title="Switch role (demo)"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container text-on-tertiary text-caption-sm font-medium">
          {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-label-md text-on-surface">{user.name}</span>
          <span className="text-caption-sm text-mute">{ROLE_LABELS[role]}</span>
        </span>
        <Icon name="expand_more" size={18} className="text-mute" />
      </button>

      {open && (
        <div className="absolute right-0 mt-xs w-[240px] rounded-lg border border-hairline bg-surface-lowest shadow-chrome z-[60] py-xs">
          <p className="px-md py-xs text-utility-xs uppercase tracking-wider text-stone">
            View as role (demo)
          </p>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-sm px-md py-sm text-label-md hover:bg-surface-soft transition-colors",
                r === role ? "text-primary-dark" : "text-on-surface",
              )}
            >
              {ROLE_LABELS[r]}
              {r === role && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
