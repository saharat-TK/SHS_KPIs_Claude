import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-container hover:bg-primary-dark text-on-tertiary shadow-sm disabled:bg-surface-dim disabled:text-mute",
  secondary:
    "bg-surface-container-high hover:bg-surface-container-highest text-on-surface",
  outline:
    "border border-hairline-strong hover:border-on-surface bg-transparent text-on-surface",
  ghost: "hover:bg-surface-soft text-on-surface",
  danger: "bg-error hover:bg-on-error-container text-on-error shadow-sm",
};

const SIZES: Record<Size, string> = {
  sm: "h-[30px] px-md text-label-md gap-xs",
  md: "h-[36px] px-lg text-label-md gap-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", icon, iconRight, className, children, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-DEFAULT font-medium transition-colors disabled:cursor-not-allowed whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
    </button>
  ),
);
Button.displayName = "Button";
