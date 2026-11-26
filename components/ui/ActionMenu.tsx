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
  /** Not used by a group row (one with `submenu`) — it expands instead. */
  onSelect?: () => void;
  /** Material symbol name, rendered leading. */
  icon?: string;
  /** "danger" paints the row red — for destructive actions. */
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Tooltip, e.g. the reason an item is disabled. */
  title?: string;
  /** Makes this row a group header: choosing it expands these items in place
   *  without closing the menu. One level only. */
  submenu?: ActionMenuItem[];
  /** Marks the current choice with a check mark — pair with `disabled` to make
   *  it inert, as for "the status it already has". */
  selected?: boolean;
  /** Draws a divider above this row. */
  separatorBefore?: boolean;
}

/** One rendered row: a top-level item, or an item of the expanded group. */
interface Row {
  item: ActionMenuItem;
  key: string;
  /** Label of the group this row belongs to; absent for top-level rows. */
  parent?: string;
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
  // Label of the group currently expanded, if any.
  const [expanded, setExpanded] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // What is actually on screen: every top-level item, plus the expanded group's
  // items right after their header. Highlight and arrow keys index into this.
  const rows: Row[] = items.flatMap((item) => {
    const own: Row = { item, key: item.label };
    if (!item.submenu || expanded !== item.label) return [own];
    return [
      own,
      ...item.submenu.map((sub) => ({
        item: sub,
        key: `${item.label}/${sub.label}`,
        parent: item.label,
      })),
    ];
  });
  const enabledIndexes = rows.flatMap((row, i) => (row.item.disabled ? [] : [i]));

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
    // The panel is already in the DOM (hidden) when this runs, so use its real
    // height — expanding a group changes it. The estimate covers the first pass.
    const height = panelRef.current?.offsetHeight || rows.length * ITEM_HEIGHT_PX + PANEL_PADDING_PX;
    const width = Math.max(MIN_WIDTH_PX, panelRef.current?.offsetWidth ?? MIN_WIDTH_PX);
    // Flip above the trigger when the panel would run off the bottom.
    const below = rect.bottom + GAP_PX;
    const top = below + height > window.innerHeight ? rect.top - GAP_PX - height : below;
    const left = align === "right" ? rect.right - width : rect.left;
    setCoords({
      top: Math.max(GAP_PX, top),
      left: Math.max(GAP_PX, Math.min(left, window.innerWidth - width - GAP_PX)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rows.length, align]);

  // Start the highlight on the first item that can actually be chosen, and
  // always reopen with every group collapsed.
  useEffect(() => {
    if (!open) setExpanded(null);
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
    // A group header only expands or collapses — the menu stays open.
    if (item.submenu) {
      setExpanded((current) => (current === item.label ? null : item.label));
      return;
    }
    // Close first: onSelect often navigates or opens a dialog, and the menu
    // should not still be sitting there underneath it.
    close(false);
    item.onSelect?.();
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
      case "ArrowRight": {
        const row = rows[highlighted];
        if (row?.item.submenu && !row.item.disabled) {
          e.preventDefault();
          setExpanded(row.item.label);
        }
        break;
      }
      case "ArrowLeft": {
        const row = rows[highlighted];
        if (!row) break;
        if (row.parent) {
          // Inside a group: collapse it and land back on its header.
          e.preventDefault();
          setHighlighted(rows.findIndex((r) => r.key === row.parent));
          setExpanded(null);
        } else if (row.item.submenu && expanded === row.item.label) {
          e.preventDefault();
          setExpanded(null);
        }
        break;
      }
      case "Enter":
      case " ":
        e.preventDefault();
        if (rows[highlighted]) choose(rows[highlighted].item);
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
          "grid h-8 w-8 place-items-center rounded text-mute transition-colors",
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
            {rows.map(({ item, key, parent }, i) => {
              const isGroup = !!item.submenu;
              const isFirstOfGroup = !!parent && rows[i - 1]?.key === parent;
              return (
                <button
                  key={key}
                  type="button"
                  role={item.selected !== undefined ? "menuitemradio" : "menuitem"}
                  aria-checked={item.selected !== undefined ? item.selected : undefined}
                  aria-expanded={isGroup ? expanded === item.label : undefined}
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
                    // A selected row is the current value, not an action: the
                    // caller disables it, but it should read as plain muted text
                    // rather than a greyed-out, forbidden control.
                    item.selected
                      ? "disabled:cursor-default disabled:text-mute"
                      : "disabled:cursor-not-allowed disabled:opacity-40",
                    item.tone === "danger" ? "text-error" : "text-on-surface",
                    item.separatorBefore && i > 0 && "border-t border-hairline",
                    parent && "bg-surface-soft pl-lg",
                    isFirstOfGroup && "border-t border-hairline",
                    !item.disabled &&
                      highlighted === i &&
                      (item.tone === "danger"
                        ? "bg-error/10"
                        : parent
                          ? "bg-surface-container-high"
                          : "bg-surface-soft"),
                  )}
                >
                  {item.icon && <Icon name={item.icon} size={18} />}
                  <span className="flex-1 truncate">{item.label}</span>
                  {isGroup && <Icon name={expanded === item.label ? "expand_less" : "expand_more"} size={18} />}
                  {item.selected && <Icon name="check" size={18} />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
