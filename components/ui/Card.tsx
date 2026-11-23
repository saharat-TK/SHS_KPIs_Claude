import { cn } from "@/lib/utils";

export function Card({
  className,
  title,
  elevated = false,
  children,
}: {
  className?: string;
  /** Native tooltip. For a second reading of the card's own number, not for a
   *  heading — use CardHeader for that. */
  title?: string;
  /** Lift the card with a soft shadow instead of a 1px outline. Opt-in: the
   *  outlined card is still the default everywhere else. */
  elevated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      title={title}
      className={cn(
        // Chosen here rather than overridden by `className`: cn() only
        // concatenates, so a `border-0` passed in would not reliably win.
        elevated
          ? "bg-surface-lowest rounded-lg shadow-md"
          : "bg-surface-lowest rounded-lg border border-hairline",
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
        "flex items-center justify-between gap-md border-b border-hairline px-lg py-md",
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
  return <div className={cn("p-lg", className)}>{children}</div>;
}
