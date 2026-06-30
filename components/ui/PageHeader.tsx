export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-md">
      <div className="min-w-0">
        <h1 className="text-heading-xl text-on-surface">{title}</h1>
        {description && (
          <p className="text-body-sm text-mute mt-xs max-w-[640px]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-sm">{actions}</div>}
    </div>
  );
}
