"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_LABELS } from "@/lib/auth/can";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const { user, role, personaId, personas, setPersona } = useAuth();
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
        title="Switch persona (demo)"
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
        <div className="absolute right-0 mt-xs w-[280px] rounded-lg border border-hairline bg-surface-lowest shadow-chrome z-[60] py-xs">
          <p className="px-md py-xs text-utility-xs uppercase tracking-wider text-stone">
            View as persona (demo)
          </p>
          {personas.map((p) => (
            <button
              key={p.personaId}
              onClick={() => {
                setPersona(p.personaId);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-start justify-between gap-sm px-md py-sm text-left hover:bg-surface-soft transition-colors",
                p.personaId === personaId ? "text-primary-dark" : "text-on-surface",
              )}
            >
              <span className="flex flex-col leading-tight">
                <span className="text-label-md">{p.name}</span>
                {p.hint && <span className="text-caption-sm text-mute">{p.hint}</span>}
              </span>
              {p.personaId === personaId && <Icon name="check" size={18} className="mt-tiny shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
