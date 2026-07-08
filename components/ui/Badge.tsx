import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "primary";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-soft border-hairline text-mute",
  success: "bg-[#e9f3dd] border-[#bcd99a] text-[#2f6500]",
  warning: "bg-[#fbeed6] border-[#e9c98a] text-[#8a4b00]",
  error: "bg-error-container border-[#f0b6b0] text-on-error-container",
  info: "bg-[#e0ecfb] border-[#b3cdee] text-link-blue",
  primary: "bg-surface-soft border-primary-container text-primary-dark",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  uppercase,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  uppercase?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-xs px-sm py-tiny rounded-xl border text-caption-sm font-medium whitespace-nowrap",
        uppercase && "uppercase tracking-wider text-utility-xs",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
