"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full border-collapse text-body-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  sortable,
  sortDir,
  onSort,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDir?: "asc" | "desc" | null;
  onSort?: () => void;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "border-b border-hairline px-lg py-sm text-caption-sm font-medium uppercase tracking-wider text-mute",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        sortable && "cursor-pointer select-none hover:text-on-surface",
        className,
      )}
      onClick={sortable ? onSort : undefined}
    >
      <span className={cn("inline-flex items-center gap-xs", align === "right" && "flex-row-reverse")}>
        {children}
        {sortable && (
          <Icon
            name={sortDir === "asc" ? "arrow_upward" : sortDir === "desc" ? "arrow_downward" : "unfold_more"}
            size={14}
            className={cn(sortDir ? "text-on-surface" : "text-stone")}
          />
        )}
      </span>
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
}) {
  return (
    <td
      onClick={onClick}
      className={cn(
        "border-b border-hairline px-lg py-sm text-on-surface align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        "hover:bg-surface-soft transition-colors",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}
