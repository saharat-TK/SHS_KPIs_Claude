"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/** Panel geometry, needed up front to decide whether it fits below the trigger. */
const ITEM_HEIGHT_PX = 36;
const PANEL_PADDING_PX = 8;
const GAP_PX = 4;
const MIN_WIDTH_PX = 180;

export interface ActionMenuItem {
  label: string;
  onSelect: () => void;
  /** Material symbol name, rendered leading. */
  icon?: string;
  /** "danger" paints the row red — for destructive actions. */
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Tooltip, e.g. the reason an item is disabled. */
  title?: string;
}

/**
 * A click-opened action menu for table rows ("kebab" / overflow menu).
 *
 * PORTALED, unlike HoverPopover and Combobox, and that is the whole reason this
 * exists as its own component: Table.tsx wraps every table in
 * `overflow-x-auto`, and CSS resolves the other axis to `auto` whenever one is
 * not `visible` — so an `absolute` panel inside a <td> gets clipped, worst on
 * the last rows where it needs to open upward. The panel therefore renders into
 * document.body at `position: fixed`, with coordinates measured from the
 * trigger.
 *
 * The cost of `fixed` is that those coordinates go stale the moment anything
 * scrolls, so the menu closes on scroll and resize rather than drifting away
 * from its row.
 */
export function ActionMenu({
  items,
  label,
  align = "right",
}: {
  items: ActionMenuItem[];
  /** Names the trigger and the menu for assistive tech — there is no visible label. */
  label: string;
  /** Which edge of the trigger the panel lines up with. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const enabledIndexes = items.flatMap((item, i) => (item.disabled ? [] : [i]));

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // Measure before paint so the panel never renders at the wrong spot first.
  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = items.length * ITEM_HEIGHT_PX + PANEL_PADDING_PX;
    const width = Math.max(MIN_WIDTH_PX, panelRef.current?.offsetWidth ?? MIN_WIDTH_PX);
    // Flip above the trigger when the panel would run off the bottom.
    const below = rect.bottom + GAP_PX;
    const top = below + height > window.innerHeight ? rect.top - GAP_PX - height : below;
    const left = align === "right" ? rect.right - width : rect.left;
    setCoords({
      top: Math.max(GAP_PX, top),
      left: Math.max(GAP_PX, Math.min(left, window.innerWidth - width - GAP_PX)),
    });
  }, [open, items.length, align]);

  // Start the highlight on the first item that can actually be chosen.
  useEffect(() => {
    if (open) setHighlighted(enabledIndexes[0] ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Move focus into the panel so the arrow keys reach its handler. Two traps
  // here, both hit during review: React's `autoFocus` is a no-op on a plain
  // <div>, and focusing an element that is still `visibility: hidden` silently
  // does nothing — so this has to wait until coords are committed and the panel
  // is actually visible. The ref keeps it to once per open.
  const focusedOnOpen = useRef(false);
  useEffect(() => {
    if (!open) {
      focusedOnOpen.current = false;
      return;
    }
    if (coords && !focusedOnOpen.current) {
      focusedOnOpen.current = true;
      panelRef.current?.focus();
    }
  }, [open, coords]);

  useEffect(() => {
    if (!open) return;
    // mousedown, not click: it fires before focus moves, so the panel closes
    // without racing whatever was clicked. The panel is portaled, so it is NOT
    // inside the trigger's wrapper — both refs have to be checked.
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close(false);
    };
    // Capture phase so a scroll inside the table's own overflow container is
    // caught too — it never reaches window in the bubble phase.
    const onScroll = () => close(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, close]);

  const move = (delta: number) => {
    if (enabledIndexes.length === 0) return;
    const at = enabledIndexes.indexOf(highlighted);
    const next = at === -1 ? 0 : (at + delta + enabledIndexes.length) % enabledIndexes.length;
    setHighlighted(enabledIndexes[next]);
  };

  const choose = (item: ActionMenuItem) => {
    if (item.disabled) return;
    // Close first: onSelect often navigates or opens a dialog, and the menu
    // should not still be sitting there underneath it.
    close(false);
    item.onSelect();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        // Stops the native event reaching window, where Modal keeps its own
        // Escape listener — otherwise this would close the surrounding dialog
        // as well as the menu. Same reasoning as Combobox.
        e.stopPropagation();
        e.preventDefault();
        close();
        break;
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        setHighlighted(enabledIndexes[0] ?? 0);
        break;
      case "End":
        e.preventDefault();
        setHighlighted(enabledIndexes[enabledIndexes.length - 1] ?? 0);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (items[highlighted]) choose(items[highlighted]);
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          // Opening with the keyboard should land on the first item, so the
          // arrow keys work without a second press.
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "grid h-8 w-8 place-items-center rounded-DEFAULT text-mute transition-colors",
          "hover:bg-surface-soft hover:text-on-surface",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container",
          open && "bg-surface-soft text-on-surface",
        )}
      >
        <Icon name="more_vert" size={20} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              // Hidden until measured, so it never flashes at the wrong place.
              visibility: coords ? "visible" : "hidden",
            }}
            className={cn(
              "fixed z-[200] min-w-[180px] overflow-hidden rounded-lg py-tiny",
              "border border-hairline bg-surface-lowest shadow-lg",
              "focus:outline-none",
            )}
          >
            {items.map((item, i) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                title={item.title}
                tabIndex={-1}
                onMouseEnter={() => !item.disabled && setHighlighted(i)}
                // onMouseDown fires before the document mousedown listener
                // resolves focus, which keeps the close and the select from
                // racing — the same rule Combobox's rows follow.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(item);
                }}
                className={cn(
                  "flex w-full items-center gap-sm px-md py-sm text-left text-body-sm transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  item.tone === "danger" ? "text-error" : "text-on-surface",
                  !item.disabled &&
                    highlighted === i &&
                    (item.tone === "danger" ? "bg-error/10" : "bg-surface-soft"),
                )}
              >
                {item.icon && <Icon name={item.icon} size={18} />}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
