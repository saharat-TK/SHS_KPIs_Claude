export function PageHeader({
  title,
  titleAdornment,
  description,
  actions,
}: {
  title: string;
  /** Rendered as a sibling right after the title text — not nested inside the
   *  <h1> — so an interactive control here (e.g. an info-icon trigger) never
   *  pollutes the heading's accessible name. */
  titleAdornment?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-md">
      <div className="min-w-0">
        <div className="flex items-center gap-xs">
          <h1 className="text-heading-xl text-on-surface">{title}</h1>
          {titleAdornment}
        </div>
        {description && (
          <p className="text-body-sm text-mute mt-xs max-w-[640px]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-sm">{actions}</div>}
    </div>
  );
}
