"use client";

import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export function Table({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className={cn("w-full border-collapse text-body-sm", className)} style={style}>
        {children}
      </table>
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
  wrap = false,
}: {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDir?: "asc" | "desc" | null;
  onSort?: () => void;
  align?: "left" | "right" | "center";
  /** Let the label wrap to at most two lines instead of staying on one. */
  wrap?: boolean;
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
      <span
        className={cn(
          "inline-flex gap-xs",
          wrap ? "max-w-full items-start" : "items-center",
          align === "right" && "justify-end",
        )}
      >
        {wrap ? (
          <span className="line-clamp-2 min-w-0 break-words leading-tight">{children}</span>
        ) : (
          children
        )}
        {sortable && (
          <Icon
            name={sortDir === "asc" ? "arrow_upward" : sortDir === "desc" ? "arrow_downward" : "unfold_more"}
            size={14}
            className={cn("shrink-0", wrap && "mt-px", sortDir ? "text-on-surface" : "text-stone")}
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
  rowSpan,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
  rowSpan?: number;
}) {
  return (
    <td
      onClick={onClick}
      rowSpan={rowSpan}
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
