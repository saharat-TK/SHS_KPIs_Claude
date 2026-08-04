"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { SearchInput } from "./Input";

export interface ComboboxOption {
  id: string;
  label: string;
}

const ROW_HEIGHT_PX = 36;
const VISIBLE_ROWS = 10;

/**
 * A searchable single-select dropdown, for pickers whose option list is too
 * long to browse in a native <select> — the browser gives that element no way
 * to cap its height or add a search box, so a long list either runs off the
 * screen or forces scrolling through it by eye. This caps the panel at
 * ~10 rows with an internal scrollbar and filters as you type.
 *
 * Not portaled: it positions with `absolute top-full`, the same as
 * HoverPopover, so it relies on not having an `overflow:hidden` ancestor
 * (true of Modal.tsx) between it and the trigger.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  noneLabel = "None",
  clearable = true,
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** Label for the "no selection" row. */
  noneLabel?: string;
  /** Whether a "no selection" row is offered at all. */
  clearable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;
  }, [options, query]);

  // The "None" row occupies index 0 when present, shifting every option down one.
  const rowCount = filtered.length + (clearable ? 1 : 0);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const openNow = () => {
    if (disabled) return;
    setHighlighted(0);
    setOpen(true);
  };

  const choose = (id: string) => {
    onChange(id);
    close();
  };

  // Autofocus the search box the moment the panel mounts.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Outside-click only — Escape is handled on the search input itself (below),
  // not here. The panel always lives inside a Modal, and Modal.tsx has its own
  // window-level Escape listener; a second one here on window would fire
  // alongside it (same target, so stopPropagation between them does nothing)
  // and close the whole dialog instead of just this panel.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlight in range as the filtered list shrinks/grows.
  useEffect(() => {
    setHighlighted((h) => Math.min(h, Math.max(rowCount - 1, 0)));
  }, [rowCount]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      // Stops the native event bubbling to window, where Modal's own Escape
      // listener lives — without this, Escape would close the panel AND the
      // modal underneath it in the same keystroke.
      e.stopPropagation();
      close();
      return;
    }
    if (rowCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, rowCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (clearable && highlighted === 0) {
        choose("");
      } else {
        const option = filtered[clearable ? highlighted - 1 : highlighted];
        if (option) choose(option.id);
      }
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (open ? close() : openNow())}
        className={cn(
          "w-full h-[36px] px-md bg-surface-lowest rounded-DEFAULT border border-hairline",
          "focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none",
          "text-body-sm text-left transition-colors flex items-center justify-between gap-sm",
          "disabled:bg-surface-soft disabled:text-mute disabled:cursor-not-allowed",
          !disabled && "cursor-pointer",
        )}
      >
        <span className={cn("truncate", selected ? "text-on-surface" : "text-stone")}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="expand_more" size={18} className="shrink-0 text-mute" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full left-0 z-40 mt-xs w-full min-w-[240px]",
            "rounded-lg border border-hairline bg-surface-lowest shadow-lg",
          )}
        >
          <div className="p-sm border-b border-hairline">
            <SearchInput
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search…"
            />
          </div>
          <div
            id={listId}
            role="listbox"
            className="overflow-y-auto scroll-thin"
            style={{ maxHeight: VISIBLE_ROWS * ROW_HEIGHT_PX }}
          >
            {rowCount === 0 ? (
              <p className="px-md py-sm text-body-sm text-mute">No matches</p>
            ) : (
              <>
                {clearable && (
                  <ComboboxRow
                    label={noneLabel}
                    muted
                    active={highlighted === 0}
                    selected={value === ""}
                    onClick={() => choose("")}
                  />
                )}
                {filtered.map((option, i) => {
                  const rowIndex = clearable ? i + 1 : i;
                  return (
                    <ComboboxRow
                      key={option.id}
                      label={option.label}
                      active={highlighted === rowIndex}
                      selected={value === option.id}
                      onClick={() => choose(option.id)}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ComboboxRow({
  label,
  active,
  selected,
  muted,
  onClick,
}: {
  label: string;
  active: boolean;
  selected: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      // onMouseDown, not onClick: mousedown fires before the search input's
      // blur, so the document-level mousedown-to-close listener above and this
      // selection don't race each other.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex w-full items-center justify-between gap-sm px-md text-left text-body-sm",
        "border-b border-hairline last:border-b-0",
        muted ? "text-mute" : "text-on-surface",
        active ? "bg-surface-soft" : "hover:bg-surface-soft",
      )}
      style={{ height: ROW_HEIGHT_PX }}
    >
      <span className="truncate">{label}</span>
      {selected && <Icon name="check" size={16} className="shrink-0 text-primary" />}
    </button>
  );
}
