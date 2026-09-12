"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * A portaled, dark-cyan hover preview card. Extracted from the dashboard's
 * sub-KPI tile preview so any trigger — a whole tile, or a small icon button —
 * can show "the same" info card rather than a visual copy that drifts from it
 * over time. Tracks the trigger's position with `getBoundingClientRect` and
 * portals to `document.body`, so it escapes any clipped/scrolling ancestor
 * (a dense grid, a table cell, a drawer body).
 *
 * Opens on hover/focus — no click-to-pin, no Escape/outside-click handling
 * (unlike `HoverPopover`) — matching the simpler interaction the dashboard
 * card has always had. `closeDelayMs` and `panelInteractive` are opt-in
 * (both default to today's exact behavior — instant close, inert panel) so
 * the dashboard's whole-tile preview is unaffected; a caller whose panel
 * holds something worth lingering over or clicking (e.g. a link) can turn
 * both on.
 */
export function HoverInfoCard({
  children,
  panel,
  panelWidth = 272,
  wrapperClassName = "inline-flex",
  closeDelayMs = 0,
  panelInteractive = false,
}: {
  /** The element that triggers the card on hover/focus. */
  children: ReactNode;
  /** Content rendered inside the cyan card. */
  panel: ReactNode;
  /** Card width in px. Position math clamps it to the viewport regardless. */
  panelWidth?: number;
  /** Layout class for the wrapping trigger span — "block h-full" for a tile
   *  that must fill its grid cell, "inline-flex" for an inline icon button. */
  wrapperClassName?: string;
  /** Grace period before closing after the cursor leaves the trigger (or the
   *  panel, when interactive), so the pointer has time to cross the gap
   *  between them. 0 (default) closes instantly, as before. */
  closeDelayMs?: number;
  /** When true, the panel accepts pointer events (a link inside it becomes
   *  clickable) and hovering it counts as still-hovering, keeping the card
   *  open. When false (default), the panel stays pointer-events-none and
   *  purely decorative, as before. */
  panelInteractive?: boolean;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const panelId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openNow = () => {
    cancelClose();
    setOpen(true);
  };
  const closeSoon = () => {
    cancelClose();
    if (closeDelayMs <= 0) {
      setOpen(false);
      return;
    }
    closeTimer.current = setTimeout(() => setOpen(false), closeDelayMs);
  };

  // A pending timer would otherwise fire into an unmounted component.
  useEffect(() => () => cancelClose(), []);

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(panelWidth, window.innerWidth - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12)),
      top: Math.min(rect.bottom + 8, window.innerHeight - 12),
    });
  }, [panelWidth]);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <span
      ref={anchorRef}
      className={wrapperClassName}
      aria-describedby={open ? panelId : undefined}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(event) => {
        if (!anchorRef.current?.contains(event.relatedTarget as Node)) {
          cancelClose();
          setOpen(false);
        }
      }}
    >
      {children}
      {ready && open &&
        createPortal(
          <div
            id={panelId}
            role="tooltip"
            style={{ ...position, width: Math.min(panelWidth, window.innerWidth - 24) }}
            className={cn(
              "fixed z-[90] max-w-[calc(100vw-24px)] animate-pop-in rounded-lg border border-cyan-500 bg-cyan-900 p-md text-white shadow-lg motion-reduce:animate-none",
              panelInteractive ? "pointer-events-auto" : "pointer-events-none",
            )}
            onMouseEnter={panelInteractive ? openNow : undefined}
            onMouseLeave={panelInteractive ? closeSoon : undefined}
          >
            {panel}
          </div>,
          document.body,
        )}
    </span>
  );
}
