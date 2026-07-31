"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

/**
 * True when the viewer asked for less motion. Every animated surface on the
 * dashboard reads this one hook, so the whole page falls back to a static
 * render together — charts skip their draw-in, numbers skip their count-up.
 *
 * Starts false so the server and the first client render agree; the media query
 * is only read in an effect.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Ease-out cubic — fast off the mark, settling onto the final number. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Counts up to `value` over `duration`, then holds. Re-runs whenever the value
 * changes, so switching year/quarter re-animates the stat cards — counting from
 * the number already on screen rather than restarting at zero.
 *
 * The displayed number is never allowed to lag the prop: requestAnimationFrame
 * is paused while the page is hidden or backgrounded, so a timer always lands
 * the exact final value even if not one frame ever runs.
 */
export function CountUp({
  value,
  digits = 0,
  duration = 600,
  suffix,
}: {
  value: number;
  digits?: number;
  duration?: number;
  suffix?: string;
}) {
  const reduced = useReducedMotion();
  // Starts at zero so the first paint counts up; later changes tween from
  // whatever is already on screen.
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    if (reduced || duration <= 0 || document.visibilityState === "hidden") {
      setShown(value);
      return;
    }
    const from = shownRef.current;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(from + (value - from) * easeOut(t));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    const settle = setTimeout(() => setShown(value), duration + 80);
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
      clearTimeout(settle);
    };
  }, [value, duration, reduced]);

  return (
    <>
      {formatNumber(shown, digits)}
      {suffix}
    </>
  );
}
