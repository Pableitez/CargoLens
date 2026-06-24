import { useTranslation as useTranslationRaw } from "./LanguageContext.jsx";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type TranslationContextValue = {
  t: TranslateFn;
  locale: "en" | "es";
  setLocale: (next: "en" | "es") => void;
};

export function useAppTranslation(): TranslationContextValue {
  return useTranslationRaw() as TranslationContextValue;
}
