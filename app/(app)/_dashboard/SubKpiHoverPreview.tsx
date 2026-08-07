"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AchievementBar } from "./AchievementBar";
import type { KpiStatus } from "@/lib/kpi/dashboard";
import { formatNumber } from "@/lib/utils";

const statusLabel = (status: KpiStatus) => {
  if (status.health === "healthy") return "On target";
  if (status.health === "watch") return "Watch";
  if (status.health === "at_risk") return "At risk";
  return status.value == null ? "No data" : "Ungraded";
};

const metric = (value: number | null, unit: string | null) =>
  value == null ? "—" : `${formatNumber(value, 2)}${unit ? ` ${unit}` : ""}`;

/**
 * A dashboard-local preview that portals to document.body, keeping dense-grid
 * details visible even when the grid itself scrolls inside a fixed-height card.
 */
export function SubKpiHoverPreview({
  status,
  children,
}: {
  status: KpiStatus;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const panelId = useId();

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelWidth = Math.min(272, window.innerWidth - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left + rect.width / 2 - panelWidth / 2, window.innerWidth - panelWidth - 12)),
      top: Math.min(rect.bottom + 8, window.innerHeight - 12),
    });
  }, []);

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
      className="block h-full"
      aria-describedby={open ? panelId : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!anchorRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      {children}
      {ready && open &&
        createPortal(
          <div
            id={panelId}
            role="tooltip"
            style={position}
            className="pointer-events-none fixed z-[90] w-[272px] max-w-[calc(100vw-24px)] animate-pop-in rounded-lg border border-cyan-500 bg-cyan-900 p-md text-white shadow-lg motion-reduce:animate-none"
          >
            <p className="text-body-sm font-bold leading-snug">{status.name}</p>
            <div className="mt-sm grid grid-cols-2 gap-x-md gap-y-xs text-caption-sm">
              <span className="text-cyan-100">ผล</span>
              <span className="text-right tabular-nums">{metric(status.value, status.unit)}</span>
              <span className="text-cyan-100">เป้า</span>
              <span className="text-right tabular-nums">{metric(status.quarterTarget, status.unit)}</span>
              <span className="text-cyan-100">Status</span>
              <span className="text-right font-medium">{statusLabel(status)}</span>
            </div>
            <div className="mt-md flex items-baseline justify-between gap-sm text-caption-sm">
              <span className="text-cyan-100">Achievement</span>
              <span className="text-body-sm font-bold tabular-nums">
                {status.pct == null ? "—" : `${formatNumber(status.pct, 0)}%`}
              </span>
            </div>
            <AchievementBar
              pct={status.pct}
              health={status.health}
              size="sm"
              showValue={false}
              className="mt-xs w-full"
            />
          </div>,
          document.body,
        )}
    </span>
  );
}
