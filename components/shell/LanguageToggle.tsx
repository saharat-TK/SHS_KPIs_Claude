"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage, useT } from "@/lib/i18n/useT";
import { LOCALES, type Locale } from "@/lib/i18n/config";

const SHORT: Record<Locale, string> = { th: "ไทย", en: "EN" };

/** Compact TH/EN segmented toggle for the Topbar (and the login page). */
export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const t = useT();
  const router = useRouter();

  const pick = (code: Locale) => {
    if (code === locale) return;
    setLocale(code);
    // Server components (the login page, <html lang>, breadcrumb overrides)
    // render from the cookie, so re-run them to reflect the new locale.
    // Client text updates reactively from context regardless.
    router.refresh();
  };

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className="flex items-center gap-tiny rounded-full border border-hairline bg-surface-soft p-tiny"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => pick(code)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-sm py-tiny text-caption-sm font-medium transition-colors",
              active
                ? "bg-success text-white shadow-sm"
                : "text-mute hover:text-on-surface",
            )}
          >
            {SHORT[code]}
          </button>
        );
      })}
    </div>
  );
}
