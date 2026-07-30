"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** How long the panel survives the pointer leaving. Long enough to cross the
 *  gap between the trigger and the panel, short enough not to feel stuck. */
const CLOSE_DELAY_MS = 200;

/**
 * A hover-opened panel that can hold interactive controls.
 *
 * The app's other hover surface is the text tooltip hand-rolled in
 * EntriesTable/AnnualQuarterProgressMatrix: it closes on mouseleave, which is
 * fine for a string and useless for buttons — the pointer could never reach
 * them. This one stays open while the pointer is over the panel itself, bridges
 * the trigger→panel gap with a short close delay, and can be pinned by clicking
 * (or pressing Enter on the trigger) so it survives the pointer leaving
 * altogether. Escape or a click outside closes it either way.
 *
 * Sits at z-40, below Modal's z-[100], so a dialog opened from inside the panel
 * covers it rather than the reverse.
 */
export function HoverPopover({
  trigger,
  children,
  label,
  align = "right",
  panelClassName,
}: {
  /** Rendered with the aria wiring to apply to the real control. */
  trigger: (props: { "aria-expanded": boolean; "aria-controls": string }) => ReactNode;
  children: ReactNode;
  /** Names the panel for assistive tech — it has no visible heading of its own. */
  label: string;
  /** Which edge the panel lines up with. Right for a trigger near the page edge. */
  align?: "left" | "right";
  panelClassName?: string;
}) {
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovering || pinned;

  const wrapRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openNow = () => {
    cancelClose();
    setHovering(true);
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setHovering(false), CLOSE_DELAY_MS);
  };
  const closeNow = () => {
    cancelClose();
    setHovering(false);
    setPinned(false);
  };

  // A pending timer would otherwise fire into an unmounted component.
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    // mousedown rather than click: a click that lands on the trigger is handled
    // by the toggle below, and this must not race it.
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) closeNow();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      // onFocus/onBlur bubble in React, so these catch the trigger and anything
      // focused inside the panel — the panel stays open while you tab through it.
      onFocus={openNow}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setHovering(false);
      }}
    >
      {/* The toggle lives on the trigger, not the wrapper: a click on a button
          inside the panel bubbles too, and would otherwise un-pin the panel the
          user is working in. Keyboard activation of the trigger arrives here as
          a click, so Enter/Space pin it as well. */}
      <span className="inline-flex" onClick={() => setPinned((p) => !p)}>
        {trigger({ "aria-expanded": open, "aria-controls": panelId })}
      </span>

      {open && (
        <div
          id={panelId}
          aria-label={label}
          className={cn(
            "absolute top-full z-40 mt-xs max-h-96 w-[min(46rem,88vw)] overflow-auto scroll-thin",
            "rounded-lg border border-hairline bg-surface-lowest shadow-lg",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </span>
  );
}
