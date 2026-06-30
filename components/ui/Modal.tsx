"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/45 p-lg sm:p-xxl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "bg-surface-lowest rounded-lg border border-hairline shadow-chrome w-full my-auto",
          size === "lg" ? "max-w-[860px]" : "max-w-[560px]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-md border-b border-hairline px-lg py-md">
          <div>
            <h2 className="text-heading-md text-on-surface">{title}</h2>
            {subtitle && <p className="text-caption-sm text-mute mt-tiny">{subtitle}</p>}
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-mute hover:text-on-surface rounded p-xs hover:bg-surface-soft transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="px-lg py-md">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-sm border-t border-hairline px-lg py-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
