// Marca y pie; overrides opcionales con VITE_* (ver frontend/.env.example).
const env = import.meta.env;

/** Nunca mostrar el nombre de producto en ALL CAPS — siempre mixed case (p. ej. NaoLab). */
function toBrandDisplayName(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "NaoLab";
  if (/^naolab$/i.test(value)) return "NaoLab";
  if (value === value.toUpperCase() && /[A-Z]/.test(value)) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
  return value;
}

// Nombre del producto en UI, meta y textos legales.
export const appName = toBrandDisplayName(env.VITE_APP_NAME ?? "NaoLab");

// Línea bajo el logo en sidebar (default EN; i18n donde aplique).
export const appTagline = env.VITE_APP_TAGLINE ?? "Trade operations platform";

// Sufijo del título de pestaña tras el punto medio.
export const appPageTitleSuffix = env.VITE_APP_TITLE_SUFFIX ?? "Trade operations";

// Meta por defecto en index.html (sincronizar o usar VITE_APP_DESCRIPTION).
export const appMetaDescription =
  env.VITE_APP_DESCRIPTION ??
  `${appName} — trade operations platform for forwarders, exporters, and importers: export orders, shipper bookings, and carrier coordination.`;

export const developerCredit = {
  name: env.VITE_SITE_AUTHOR_NAME ?? "Pablo Benéitez",
  role: env.VITE_SITE_AUTHOR_ROLE ?? "",
  year: Number(env.VITE_SITE_AUTHOR_YEAR) || 2026,
};
