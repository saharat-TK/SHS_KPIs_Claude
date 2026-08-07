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
  selectionStyle = "fill",
}: {
  items: SegmentItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
  /** Standard filled buttons, or a shared sliding selection indicator. */
  selectionStyle?: "fill" | "sliding";
}) {
  const sliding = selectionStyle === "sliding";
  const optionCount = Math.max(items.length, 1);
  const activeIndex = Math.max(items.findIndex((item) => item.id === active), 0);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        sliding
          ? "relative inline-grid items-center rounded-lg border border-hairline bg-surface-container-high p-tiny shadow-inner"
          : "inline-flex flex-wrap items-center gap-tiny rounded-xl border border-hairline bg-surface-container-high p-tiny",
        className,
      )}
      style={sliding ? { gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` } : undefined}
    >
      {sliding && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-tiny left-tiny top-tiny rounded-lg bg-primary shadow-chrome transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `calc((100% - 4px) / ${optionCount})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      )}
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
              "relative z-10 inline-flex items-center gap-xs rounded-lg px-md py-xs text-label-md transition-colors",
              sliding && "min-w-0 justify-center",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              item.disabled
                ? "cursor-not-allowed text-stone opacity-60"
                : on
                  ? sliding
                    ? "text-on-primary"
                    : "bg-primary text-on-primary shadow-chrome"
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
