"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-xs border-b border-hairline", className)} role="tablist">
      {items.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "px-md py-sm text-label-md -mb-px border-b-2 transition-colors inline-flex items-center gap-xs",
              on
                ? "border-primary-container text-primary-dark"
                : "border-transparent text-mute hover:text-on-surface",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-xs text-utility-xs",
                  on ? "bg-primary-container text-on-tertiary" : "bg-surface-container-high text-mute",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
