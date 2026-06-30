import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  unit,
  delta,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  icon?: string;
  className?: string;
}) {
  const dirColor =
    delta?.direction === "up"
      ? "text-success"
      : delta?.direction === "down"
        ? "text-error"
        : "text-mute";
  const dirIcon =
    delta?.direction === "up"
      ? "trending_up"
      : delta?.direction === "down"
        ? "trending_down"
        : "trending_flat";

  return (
    <Card className={cn("p-lg flex flex-col gap-sm", className)}>
      <div className="flex items-center justify-between">
        <span className="text-label-md text-mute">{label}</span>
        {icon && <Icon name={icon} size={20} className="text-primary" />}
      </div>
      <div className="flex items-end gap-xs">
        <span className="text-display-md text-on-surface leading-none">{value}</span>
        {unit && <span className="text-body-sm text-mute mb-tiny">{unit}</span>}
      </div>
      {delta && (
        <span className={cn("inline-flex items-center gap-xs text-caption-sm", dirColor)}>
          <Icon name={dirIcon} size={16} />
          {delta.value}
        </span>
      )}
    </Card>
  );
}
