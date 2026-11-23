"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { MONTHS, currentBEYear, formatDateBE, parseDate } from "@/lib/kpi/cellFormats";
import {
  addDays,
  addMonths,
  isoOf,
  monthGrid,
  partsOfIso,
  shiftMonth,
  todayParts,
} from "@/lib/kpi/calendar";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const GAP_PX = 4;
/** Earliest year offered in the year list (BE). */
const FIRST_YEAR = 2480;
const YEARS_AHEAD = 10;

/** A date field you can type in or pick from a calendar.
 *
 *  The text box is the real control — it takes the same `DD/MM/BBBB` (Buddhist
 *  era) everywhere a date is typed, and pasting into the batch grids still works.
 *  The calendar is an aid on top: it shows the year in BE, which the browser's
 *  own date picker cannot (it follows the browser language and would read 2026
 *  beside a 2569 field), and fills the box with the text a person would type.
 *  Nothing about parsing or storage changes: a picked date is validated and
 *  saved as CE like a typed one.
 *
 *  The panel is portaled and `fixed`, like ActionMenu, because the entry window
 *  and the grids sit inside scrolling containers that would clip an absolute one. */
export function DateInput({
  value,
  onChange,
  disabled,
  placeholder = "15/03/2569",
  title,
}: {
  /** What is in the box: BE text, as typed. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const t = todayParts();
    return { beYear: t.beYear, month: t.month };
  });
  const [focusIso, setFocusIso] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // The day to move keyboard focus to once the panel is actually visible.
  const pendingFocus = useRef<string | null>(null);

  /** The date the box currently holds, as stored CE — null if empty or unreadable. */
  const selectedIso = useMemo(() => {
    if (!value.trim()) return null;
    try {
      return parseDate(value);
    } catch {
      return null;
    }
  }, [value]);

  const today = todayParts();
  const todayIso = isoOf(today.beYear, today.month, today.day);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) inputRef.current?.focus();
  }, []);

  const openPanel = () => {
    const start = (selectedIso && partsOfIso(selectedIso)) || today;
    const startIso = selectedIso && partsOfIso(selectedIso) ? selectedIso : todayIso;
    setView({ beYear: start.beYear, month: start.month });
    setFocusIso(startIso);
    pendingFocus.current = startIso;
    setOpen(true);
  };

  const pick = (iso: string) => {
    onChange(formatDateBE(iso));
    close();
  };

  // Measure before paint so the panel never shows at the wrong spot first.
  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    const rect = wrapRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    if (!rect || !panel) return;
    const { offsetHeight: height, offsetWidth: width } = panel;
    const below = rect.bottom + GAP_PX;
    // Flip above the box when the panel would run off the bottom.
    const top = below + height > window.innerHeight ? rect.top - GAP_PX - height : below;
    setCoords({
      top: Math.max(GAP_PX, top),
      left: Math.max(GAP_PX, Math.min(rect.left, window.innerWidth - width - GAP_PX)),
    });
  }, [open, view]);

  // Keyboard focus can only land once the panel is visible (focusing a
  // `visibility: hidden` element silently does nothing), so retry until it takes.
  useEffect(() => {
    const iso = pendingFocus.current;
    if (!open || !coords || !iso) return;
    const day = panelRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);
    day?.focus();
    if (day && document.activeElement === day) pendingFocus.current = null;
  });

  useEffect(() => {
    if (!open) return;
    // mousedown, not click: it fires before focus moves, so the panel closes
    // without racing whatever was clicked. The panel is portaled, so both it and
    // the trigger have to be checked.
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close(false);
    };
    // The panel is positioned from a measurement, so scrolling the page would
    // leave it behind — close instead. Scrolling inside the panel is fine.
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      close(false);
    };
    const onResize = () => close(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, close]);

  const weeks = useMemo(() => {
    const grid = monthGrid(view.beYear, view.month);
    // Always six rows, so the panel keeps one height as you page between months.
    while (grid.length < 6) grid.push(Array.from({ length: 7 }, () => null));
    return grid;
  }, [view]);

  const years = useMemo(() => {
    const last = currentBEYear() + YEARS_AHEAD;
    const list: number[] = [];
    for (let y = Math.min(FIRST_YEAR, view.beYear); y <= Math.max(last, view.beYear); y += 1) {
      list.push(y);
    }
    return list;
  }, [view.beYear]);

  // The day that takes Tab: the keyboard-focused one if it is on screen, else the 1st.
  const tabIso = useMemo(() => {
    const parts = focusIso ? partsOfIso(focusIso) : null;
    const onScreen = parts && parts.beYear === view.beYear && parts.month === view.month;
    return onScreen ? focusIso : isoOf(view.beYear, view.month, 1);
  }, [focusIso, view]);

  const goTo = (iso: string) => {
    const parts = partsOfIso(iso);
    if (!parts) return;
    setFocusIso(iso);
    setView({ beYear: parts.beYear, month: parts.month });
    pendingFocus.current = iso;
  };

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      // Keeps the key from reaching the window listener where Modal closes the
      // whole entry window — Escape should only dismiss the calendar.
      e.stopPropagation();
      e.preventDefault();
      close();
      return;
    }
    const iso = (e.target as HTMLElement).dataset.iso;
    if (!iso) return; // only the day buttons use the arrow keys
    const next =
      e.key === "ArrowLeft" ? addDays(iso, -1)
      : e.key === "ArrowRight" ? addDays(iso, 1)
      : e.key === "ArrowUp" ? addDays(iso, -7)
      : e.key === "ArrowDown" ? addDays(iso, 7)
      : e.key === "PageUp" ? addMonths(iso, -1)
      : e.key === "PageDown" ? addMonths(iso, 1)
      : null;
    if (!next) return;
    e.preventDefault();
    goTo(next);
  };

  const step = (delta: number) => {
    const next = shiftMonth(view.beYear, view.month, delta);
    setView(next);
  };

  return (
    <>
      <div ref={wrapRef} className="relative w-full">
        <Input
          ref={inputRef}
          value={value}
          disabled={disabled}
          inputMode="numeric"
          maxLength={10}
          placeholder={placeholder}
          title={title}
          className="pr-[40px]"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          aria-label="Open calendar"
          aria-haspopup="dialog"
          aria-expanded={open}
          title="Pick from calendar"
          disabled={disabled}
          onClick={() => (open ? close(false) : openPanel())}
          className={cn(
            "absolute right-xs top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-mute transition-colors",
            "hover:bg-surface-container-high hover:text-on-surface",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container",
            "disabled:pointer-events-none disabled:opacity-40",
            open && "bg-surface-container-high text-on-surface",
          )}
        >
          <Icon name="calendar_month" size={18} />
        </button>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Choose a date"
            onKeyDown={onPanelKeyDown}
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              // Hidden until measured, so it never flashes at the wrong place.
              visibility: coords ? "visible" : "hidden",
            }}
            className="fixed z-[200] w-[304px] rounded-lg border border-hairline bg-surface-lowest p-md shadow-lg"
          >
            <div className="mb-sm flex items-center gap-xs">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => step(-1)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="chevron_left" size={20} />
              </button>
              <select
                aria-label="Month"
                value={view.month}
                onChange={(e) => setView({ ...view, month: Number(e.target.value) })}
                className="h-8 min-w-0 flex-1 cursor-pointer rounded-md border border-hairline bg-surface-lowest px-xs text-body-sm text-on-surface"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.en}
                  </option>
                ))}
              </select>
              <select
                aria-label="Year (BE)"
                value={view.beYear}
                onChange={(e) => setView({ ...view, beYear: Number(e.target.value) })}
                className="h-8 w-[76px] shrink-0 cursor-pointer rounded-md border border-hairline bg-surface-lowest px-xs text-body-sm text-on-surface"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => step(1)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-mute hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name="chevron_right" size={20} />
              </button>
            </div>

            <div role="grid" aria-label={`${MONTHS[view.month - 1].en} ${view.beYear}`}>
              <div role="row" className="grid grid-cols-7">
                {WEEKDAYS.map((d) => (
                  <span
                    key={d}
                    role="columnheader"
                    className="grid h-8 place-items-center text-caption-sm text-mute"
                  >
                    {d}
                  </span>
                ))}
              </div>
              {weeks.map((week, w) => (
                <div key={w} role="row" className="grid grid-cols-7">
                  {week.map((cell, i) =>
                    cell ? (
                      <button
                        key={cell.iso}
                        type="button"
                        role="gridcell"
                        data-iso={cell.iso}
                        tabIndex={cell.iso === tabIso ? 0 : -1}
                        aria-selected={cell.iso === selectedIso}
                        aria-current={cell.iso === todayIso ? "date" : undefined}
                        onClick={() => pick(cell.iso)}
                        className={cn(
                          "grid h-8 place-items-center rounded-md text-body-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container",
                          cell.iso === selectedIso
                            ? "bg-primary font-medium text-on-primary"
                            : "text-on-surface hover:bg-surface-container-high",
                          cell.iso === todayIso && cell.iso !== selectedIso && "ring-1 ring-primary",
                        )}
                      >
                        {cell.day}
                      </button>
                    ) : (
                      <span key={i} role="gridcell" aria-hidden="true" className="h-8" />
                    ),
                  )}
                </div>
              ))}
            </div>

            <div className="mt-sm flex items-center justify-between border-t border-hairline pt-sm">
              <button
                type="button"
                onClick={() => pick(todayIso)}
                className="rounded-md px-sm py-xs text-body-sm font-medium text-primary hover:bg-surface-container-high"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  close();
                }}
                className="rounded-md px-sm py-xs text-body-sm text-mute hover:bg-surface-container-high hover:text-on-surface"
              >
                Clear
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
