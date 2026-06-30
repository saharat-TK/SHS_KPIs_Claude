import { cn } from "@/lib/utils";

export function Icon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", className)}
      style={size ? { fontSize: size } : undefined}
    >
      {name}
    </span>
  );
}
