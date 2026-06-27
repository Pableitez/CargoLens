// Marca y pie; overrides opcionales con VITE_* (ver frontend/.env.example).
const env = import.meta.env;

// Nombre del producto en UI, meta y textos legales.
export const appName = env.VITE_APP_NAME ?? "NaoLab";

// Línea bajo el logo en sidebar (default EN; i18n donde aplique).
export const appTagline = env.VITE_APP_TAGLINE ?? "Trade operations platform";

// Sufijo del título de pestaña tras el punto medio.
export const appPageTitleSuffix = env.VITE_APP_TITLE_SUFFIX ?? "Trade operations";

// Meta por defecto en index.html (sincronizar o usar VITE_APP_DESCRIPTION).
export const appMetaDescription =
  env.VITE_APP_DESCRIPTION ??
  `${appName} — free logistics platform for forwarders, exporters, and importers: export orders, shipper bookings, and container visibility.`;

export const developerCredit = {
  name: env.VITE_SITE_AUTHOR_NAME ?? "Pablo Benéitez",
  role: env.VITE_SITE_AUTHOR_ROLE ?? "",
  year: Number(env.VITE_SITE_AUTHOR_YEAR) || 2026,
};
