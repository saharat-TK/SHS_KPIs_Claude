import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

const base =
  "w-full h-[44px] px-md bg-surface-lowest rounded-DEFAULT border border-hairline focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none text-body-sm text-on-surface placeholder:text-stone transition-colors disabled:bg-surface-soft disabled:text-mute";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cn(base, className)} {...rest} />
));
Input.displayName = "Input";

export function SearchInput({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative w-full">
      <Icon
        name="search"
        size={20}
        className="absolute left-md top-1/2 -translate-y-1/2 text-mute pointer-events-none"
      />
      <input className={cn(base, "h-[40px] pl-[40px]", className)} {...rest} />
    </div>
  );
}

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select ref={ref} className={cn(base, "pr-xl appearance-none cursor-pointer", className)} {...rest}>
    {children}
  </select>
));
Select.displayName = "Select";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-md text-on-surface">{label}</span>
      {children}
      {hint && <span className="text-caption-sm text-mute">{hint}</span>}
    </label>
  );
}
