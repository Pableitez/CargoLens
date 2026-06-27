import type { ReactElement, ReactNode } from "react";

export type Locale = "en" | "es";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export type TranslationContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: TranslateFn;
  dateLocale: string;
};

export function LanguageProvider(props: { children: ReactNode }): ReactElement;
export function useTranslation(): TranslationContextValue;
