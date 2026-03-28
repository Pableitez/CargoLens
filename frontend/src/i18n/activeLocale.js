// Sincronizado por LanguageProvider; format.js lo lee sin React.
let activeLocale = "en";

export function setActiveLocale(l) {
  activeLocale = l === "es" ? "es" : "en";
}

export function getActiveLocale() {
  return activeLocale;
}

// BCP 47 para Intl / fechas.
export function getDateLocaleForFormat() {
  return activeLocale === "es" ? "es-ES" : "en-GB";
}
