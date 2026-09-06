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
  variant = "underline",
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  /** Filled tabs are opt-in for dense, table-scoped filters. */
  variant?: "underline" | "filled";
}) {
  return (
    <div
      className={cn(
        "flex gap-xs",
        variant === "filled" ? "items-stretch" : "items-center border-b border-hairline",
        className,
      )}
      role="tablist"
    >
      {items.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              // text-left overrides the browser's default centered button text,
              // which otherwise centers a long label's wrapped second line
              // instead of keeping it flush with the first.
              "px-md py-sm text-label-md text-left transition-colors inline-flex items-center gap-xs",
              variant === "underline"
                ? on
                  ? "-mb-px border-b-2 border-primary-container text-primary-dark"
                  : "-mb-px border-b-2 border-transparent text-mute hover:text-on-surface"
                : on
                  ? "relative z-10 rounded-t-lg bg-primary-container text-on-primary-container shadow-md"
                  : "rounded-t-lg bg-surface-container-high text-mute hover:bg-surface-container-highest hover:text-on-surface",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-xl px-xs text-utility-xs",
                  variant === "filled"
                    ? on
                      ? "bg-primary-fixed text-on-primary-container"
                      : "bg-surface-lowest text-mute"
                    : on
                      ? "bg-primary-container text-on-tertiary"
                      : "bg-surface-container-high text-mute",
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
