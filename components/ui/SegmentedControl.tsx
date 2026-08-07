"use client";

import { cn } from "@/lib/utils";

export interface SegmentItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

/**
 * A filter switch with mutually exclusive options.
 *
 * Deliberately not Tabs: this sits directly above the group tab bar, and two
 * identical underline rows stacked would read as one confused control. A pill
 * group also has somewhere to put a disabled state, which Tabs has no notion of.
 *
 * aria-pressed rather than role="tab" — these buttons filter the page in place,
 * they do not switch panels.
 */
export function SegmentedControl({
  items,
  active,
  onChange,
  ariaLabel,
  className,
}: {
  items: SegmentItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex flex-wrap items-center gap-tiny rounded-xl border border-hairline bg-surface-container-high p-tiny",
        className,
      )}
    >
      {items.map((item) => {
        const on = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={on}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-xs rounded-lg px-md py-xs text-label-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              item.disabled
                ? "cursor-not-allowed text-stone opacity-60"
                : on
                  ? "bg-primary text-on-primary shadow-chrome"
                  : "text-mute hover:bg-surface-lowest hover:text-on-surface",
            )}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "rounded-xl px-xs text-utility-xs",
                  on ? "bg-primary-container text-on-tertiary" : "bg-surface-lowest text-mute",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
