"use client";

import { useContext, useMemo } from "react";
import { LanguageContext } from "./LanguageProvider";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { translate, type TranslationKey } from "./dictionaries";

/** The active UI locale. Falls back to the default outside a provider. */
export function useLocale(): Locale {
  return useContext(LanguageContext)?.locale ?? DEFAULT_LOCALE;
}

/** Read + set the locale (for the language switcher). */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export type TFunction = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string;

/** Returns a translator bound to the active locale. */
export function useT(): TFunction {
  const locale = useLocale();
  return useMemo<TFunction>(
    () => (key, vars) => translate(locale, key, vars),
    [locale],
  );
}
