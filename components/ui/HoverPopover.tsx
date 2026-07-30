"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** How long the panel survives the pointer leaving. Long enough to cross the
 *  gap between the trigger and the panel, short enough not to feel stuck. */
const CLOSE_DELAY_MS = 200;
const MOTION_DURATION_MS = 160;

type PopoverChildren =
  | ReactNode
  | ((controls: { close: () => void }) => ReactNode);

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
  /** A render function can close the panel before opening a secondary surface. */
  children: PopoverChildren;
  /** Names the panel for assistive tech — it has no visible heading of its own. */
  label: string;
  /** Which edge the panel lines up with. Right for a trigger near the page edge. */
  align?: "left" | "right";
  panelClassName?: string;
}) {
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const open = hovering || pinned;

  const wrapRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrame = useRef<number | null>(null);
  const panelId = useId();

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const cancelPresenceTimer = () => {
    if (presenceTimer.current) {
      clearTimeout(presenceTimer.current);
      presenceTimer.current = null;
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
      if (presenceTimer.current) clearTimeout(presenceTimer.current);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    },
    [],
  );

  // Keep the panel in the DOM just long enough for its exit transition. A frame
  // between mounting and visibility lets the opening scale/fade transition run.
  useEffect(() => {
    cancelPresenceTimer();
    if (open) {
      setMounted(true);
      animationFrame.current = requestAnimationFrame(() => setVisible(true));
      return () => {
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      };
    }

    setVisible(false);
    if (!mounted) return;
    presenceTimer.current = setTimeout(() => setMounted(false), MOTION_DURATION_MS);
  }, [open, mounted]);

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

      {mounted && (
        <div
          id={panelId}
          aria-label={label}
          aria-hidden={!open}
          className={cn(
            "absolute top-full z-40 mt-xs max-h-96 w-max max-w-[88vw] overflow-auto scroll-thin",
            "origin-top-right rounded-lg border border-hairline shadow-lg",
            !panelClassName && "bg-surface-lowest",
            "transition-[opacity,transform] duration-[160ms] ease-out",
            align === "right" ? "right-0" : "left-0",
            visible ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children({ close: closeNow }) : children}
        </div>
      )}
    </span>
  );
}
