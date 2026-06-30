import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-surface-lowest rounded-lg border border-hairline",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-md border-b border-hairline px-xl py-lg",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-heading-md text-on-surface truncate">{title}</h2>
        {subtitle && (
          <p className="text-caption-sm text-mute mt-tiny">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-sm shrink-0">{actions}</div>}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-xl", className)}>{children}</div>;
}
