import { cn } from "@/lib/utils";

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  className,
  orientation = "vertical",
}: {
  name: string;
  value: T;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
}) {
  const horizontalCols =
    options.length <= 2 ? "sm:grid-cols-2" : options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";

  return (
    <div
      role="radiogroup"
      className={cn(
        orientation === "horizontal"
          ? `grid grid-cols-1 ${horizontalCols} gap-xs`
          : "flex flex-col gap-xs",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <label
            key={opt.value}
            className={cn(
              "flex items-start gap-sm rounded-DEFAULT px-md py-sm cursor-pointer transition-colors",
              selected ? "bg-surface-soft" : "hover:bg-surface-soft"
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "mt-[2px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border transition-colors",
                selected ? "border-primary-container" : "border-stone"
              )}
            >
              {selected && (
                <span className="h-[8px] w-[8px] rounded-full bg-primary-container" />
              )}
            </span>
            <span className="flex flex-col gap-[2px]">
              <span className="text-body-sm text-on-surface">{opt.label}</span>
              {opt.hint && (
                <span className="text-caption-sm text-mute">{opt.hint}</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
