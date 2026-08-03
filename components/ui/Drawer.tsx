"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { useReducedMotion } from "./CountUp";

const MOTION_DURATION_MS = 200;

/**
 * A panel that slides in from the right edge. Sibling to Modal — same prop
 * vocabulary (open/onClose/title/subtitle/footer) so the two read alike.
 *
 * Presence follows HoverPopover rather than Modal: Modal's `if (!open) return
 * null` forecloses an exit transition, and Sidebar's always-mounted approach
 * doesn't fit a panel whose body mounts data hooks for a selected row. So we
 * mount first, flip `visible` on the next frame, and unmount after the slide
 * out finishes.
 *
 * Layered at z-90 — deliberately *below* Modal's z-100, so a Modal opened from
 * inside a Drawer (e.g. a note dialog) stacks on top with the drawer's context
 * still visible behind it.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  headerExtra,
  footer,
  children,
  width = "md",
  closeOnEscape = true,
  closeOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** ReactNode, unlike Modal's string — a status pill often belongs here. */
  subtitle?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: "md" | "lg";
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const presenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const reduced = useReducedMotion();
  const duration = reduced ? 0 : MOTION_DURATION_MS;

  // The caller typically clears its selection state on close, which would blank
  // the panel while it is still sliding out. Hold the last open children and
  // render those during the exit. A ref (not state) because `children` is a new
  // element every render — an effect on it would loop.
  const heldChildren = useRef(children);
  if (open) heldChildren.current = children;

  // Mount on open; on close, slide out first and unmount once that finishes.
  // Deliberately does NOT depend on `mounted` — see the visibility effect below.
  useEffect(() => {
    if (open) {
      if (presenceTimer.current) clearTimeout(presenceTimer.current);
      setMounted(true);
      return;
    }
    setVisible(false);
    presenceTimer.current = setTimeout(() => setMounted(false), duration);
    return () => {
      if (presenceTimer.current) clearTimeout(presenceTimer.current);
    };
  }, [open, duration]);

  // Flip to visible one frame after the panel exists off-screen, so the browser
  // has a painted start state to transition from. Kept in its own effect keyed
  // only to (mounted, open): folding this into the effect above means `mounted`
  // has to be a dependency, and its cleanup then cancels this frame the moment
  // mounting re-runs it — leaving the panel mounted but parked off-screen.
  useEffect(() => {
    if (!mounted || !open) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [mounted, open]);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onClose]);

  // Lock background scroll, compensating for the vanishing scrollbar so the
  // page behind doesn't shift. Restores the previous inline values rather than
  // clearing them, in case something else was already managing them.
  useEffect(() => {
    if (!open) return;
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  // Move focus into the panel, and hand it back to wherever it came from.
  // Note there is no focus trap — Modal has none either, and adding one only
  // here would make the two behave differently.
  useEffect(() => {
    if (!open) {
      restoreFocusTo.current?.focus?.();
      restoreFocusTo.current = null;
      return;
    }
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-black/45 transition-opacity",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${duration}ms` }}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "fixed inset-y-0 right-0 z-[90] flex h-full w-full flex-col outline-none",
          "bg-surface-lowest border-l border-hairline shadow-chrome",
          "transition-transform ease-[cubic-bezier(0.16,1,0.3,1)]",
          width === "lg" ? "sm:w-[640px]" : "sm:w-[520px]",
          // No `translate-x-0` when open, on purpose: any non-`none` transform
          // would make this a containing block for descendants, which breaks
          // the `fixed` hover tooltip inside AnnualQuarterProgressMatrix (it
          // positions from clientX/clientY and sits at z-300). CSS still
          // interpolates translateX(100%) -> none, so the slide is unaffected.
          !visible && "translate-x-full",
        )}
        style={{ transitionDuration: `${duration}ms` }}
      >
        <div className="shrink-0 border-b border-hairline px-lg py-md">
          <div className="flex items-start justify-between gap-md">
            <div className="min-w-0">
              <h2 id={titleId} className="text-heading-md text-on-surface">
                {title}
              </h2>
              {subtitle && <p className="text-caption-sm text-mute mt-tiny">{subtitle}</p>}
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="text-mute hover:text-on-surface rounded p-xs hover:bg-surface-soft transition-colors shrink-0"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          {headerExtra && <div className="mt-sm">{headerExtra}</div>}
        </div>

        {/* min-h-0 is load-bearing: without it flex-1 refuses to shrink below
            content height and pushes the footer off-screen. */}
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-lg py-md">
          {open ? children : heldChildren.current}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-hairline px-lg py-md">{footer}</div>
        )}
      </div>
    </>
  );
}
