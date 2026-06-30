import { Icon } from "./Icon";
import { EmptyState } from "./EmptyState";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-sm py-section text-mute">
      <Icon name="progress_activity" size={24} className="animate-spin" />
      {label && <span className="text-body-sm">{label}</span>}
    </div>
  );
}

export function QueryBoundary({
  isLoading,
  isError,
  loadingLabel = "Loading…",
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
}) {
  if (isLoading) return <Spinner label={loadingLabel} />;
  if (isError)
    return (
      <EmptyState
        icon="error"
        title="Couldn't load data"
        message="Something went wrong fetching this view. Try reloading."
      />
    );
  return <>{children}</>;
}
