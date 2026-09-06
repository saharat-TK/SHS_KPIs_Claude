import { Icon } from "./Icon";

/** A compact, non-interactive completion signal for an editable card header. */
export function SectionInputStatusIcon({
  complete,
  section,
}: {
  complete: boolean;
  section: string;
}) {
  const status = complete ? "complete" : "incomplete";

  return (
    <span
      role="img"
      aria-label={`${section} ${status}`}
      title={`${section} ${status}`}
      className={`inline-flex h-6 w-6 items-center justify-center transition-colors duration-200 ${
        complete ? "text-success" : "text-warning"
      }`}
    >
      <Icon
        key={status}
        name={complete ? "check_circle" : "warning"}
        size={20}
        className="animate-pop-in motion-reduce:animate-none"
      />
    </span>
  );
}
