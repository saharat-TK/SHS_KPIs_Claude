import { Icon } from "./Icon";

export function EmptyState({
  icon = "inbox",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-sm py-section text-center">
      <Icon name={icon} size={40} className="text-stone" />
      <p className="text-body-strong text-on-surface">{title}</p>
      {message && <p className="text-body-sm text-mute max-w-[420px]">{message}</p>}
      {action && <div className="mt-sm">{action}</div>}
    </div>
  );
}
