import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setActiveLocale } from "./activeLocale.js";
import en from "./locales/en.js";
import es from "./locales/es.js";

const STORAGE_KEY = "freightboard-locale";

const messages = { en, es };

function getByPath(obj, path) {
  return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function interpolate(str, vars) {
  if (!vars || typeof str !== "string") return str;
  let out = str;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
  }
  return out;
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "es" || s === "en") return s;
    } catch {
      // ignorar
    }
    return "en";
  });

  // Alinear locale con format.js antes de que monten los hijos.
  setActiveLocale(locale);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignorar
    }
    document.documentElement.lang = locale === "es" ? "es" : "en";
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (next === "es" || next === "en") setLocaleState(next);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const fromLocale = getByPath(messages[locale], key);
      const fromEn = getByPath(messages.en, key);
      const raw = fromLocale !== undefined ? fromLocale : fromEn !== undefined ? fromEn : key;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      // BCP 47 para Intl donde haga falta explícito.
      dateLocale: locale === "es" ? "es-ES" : "en-GB",
    }),
    [locale, setLocale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
