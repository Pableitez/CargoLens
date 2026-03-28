/**
 * Regenerates locales/en/*.js and locales/es/*.js from the composed en.js / es.js tree.
 * Run: node scripts/split-locales.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../src/i18n/locales");

function pick(obj, keys) {
  const o = {};
  for (const k of keys) {
    if (obj[k] !== undefined) o[k] = obj[k];
  }
  return o;
}

const enApiErrors = {
  generic: "Something went wrong. Try again.",
  DB_UNAVAILABLE: "Database is unavailable.",
  SERVER_ERROR: "Something went wrong on the server.",
  EMAIL_IN_USE: "This email is already registered.",
  INVALID_INPUT: "Invalid input.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  UNAUTHORIZED: "You need to sign in.",
  INVALID_TOKEN: "Session expired. Sign in again.",
  NOT_FOUND: "Not found.",
  INVALID_ID: "Invalid id.",
  INVALID_INVITE: "Invalid invite code.",
  INVALID_CLIENT: "Invalid client for this workspace.",
  INVALID_FILE: "Could not read the file.",
  EMPTY: "The sheet has no data rows.",
  FORBIDDEN: "You don't have permission.",
};

const esApiErrors = {
  generic: "Algo salió mal. Inténtalo de nuevo.",
  DB_UNAVAILABLE: "Base de datos no disponible.",
  SERVER_ERROR: "Error en el servidor.",
  EMAIL_IN_USE: "Este correo ya está registrado.",
  INVALID_INPUT: "Datos no válidos.",
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos.",
  UNAUTHORIZED: "Debes iniciar sesión.",
  INVALID_TOKEN: "Sesión caducada. Vuelve a entrar.",
  NOT_FOUND: "No encontrado.",
  INVALID_ID: "Identificador no válido.",
  INVALID_INVITE: "Código de invitación no válido.",
  INVALID_CLIENT: "Cliente no válido para este espacio.",
  INVALID_FILE: "No se pudo leer el archivo.",
  EMPTY: "La hoja no tiene filas de datos.",
  FORBIDDEN: "No tienes permiso.",
};

const enSavedPicker = {
  label: "From saved containers",
  placeholderLoading: "Loading saved containers…",
  placeholderSearch: "Search {{count}} saved… (number, client, notes)",
  placeholderEmpty: "No saved containers yet",
  loading: "Loading…",
  emptyHintBefore: "None yet — save them from the",
  workspaceList: "workspace list",
  emptyHintAfter: ".",
  typeHint: "Type to filter — avoids loading a long dropdown.",
  noMatch: "No saved containers match “{{query}}”.",
  capHint: "Showing first {{max}} matches — narrow your search.",
  listAria: "Matching saved containers",
  clearAria: "Clear search",
  clearButton: "Clear",
};

const esSavedPicker = {
  label: "Desde contenedores guardados",
  placeholderLoading: "Cargando contenedores guardados…",
  placeholderSearch: "Buscar entre {{count}} guardados… (número, cliente, notas)",
  placeholderEmpty: "Aún no hay contenedores guardados",
  loading: "Cargando…",
  emptyHintBefore: "Aún no hay — guárdalos desde la",
  workspaceList: "lista del espacio",
  emptyHintAfter: ".",
  typeHint: "Escribe para filtrar — evita un desplegable largo.",
  noMatch: "Ningún contenedor guardado coincide con «{{query}}».",
  capHint: "Mostrando las primeras {{max}} coincidencias — acota la búsqueda.",
  listAria: "Contenedores guardados coincidentes",
  clearAria: "Borrar búsqueda",
  clearButton: "Borrar",
};

async function loadDefault(file) {
  const url = pathToFileURL(path.join(localesDir, file)).href;
  const mod = await import(url);
  return mod.default;
}

function emit(lang, name, chunk) {
  const dir = path.join(localesDir, lang);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.js`);
  fs.writeFileSync(
    file,
    `/**\n * ${lang.toUpperCase()} locale — ${name}\n */\nexport default ${JSON.stringify(chunk, null, 2)};\n`
  );
}

async function main() {
  const en = await loadDefault("en.js");
  const es = await loadDefault("es.js");

  const coreEn = pick(en, [
    "brand",
    "sidebar",
    "language",
    "workspace",
    "auth",
    "mainLayout",
    "toast",
    "pageTitle",
    "error",
    "skipLink",
    "onboarding",
    "notFound",
  ]);
  coreEn.apiErrors = enApiErrors;
  coreEn.routeLoading = en.routeLoading;

  const trackingEn = pick(en, ["overview", "track", "dashboard"]);
  const uiEn = pick(en, ["components", "overviewSnapshot", "overviewMap"]);
  uiEn.components = { ...uiEn.components, savedPicker: enSavedPicker };
  const pagesEn = pick(en, ["dashboardPage"]);

  const coreEs = pick(es, [
    "brand",
    "sidebar",
    "language",
    "workspace",
    "auth",
    "mainLayout",
    "toast",
    "pageTitle",
    "error",
    "skipLink",
    "onboarding",
    "notFound",
  ]);
  coreEs.apiErrors = esApiErrors;
  coreEs.routeLoading = es.routeLoading;

  const trackingEs = pick(es, ["overview", "track", "dashboard"]);
  const uiEs = pick(es, ["components", "overviewSnapshot", "overviewMap"]);
  uiEs.components = { ...uiEs.components, savedPicker: esSavedPicker };
  const pagesEs = pick(es, ["dashboardPage"]);

  emit("en", "core", coreEn);
  emit("en", "tracking", trackingEn);
  emit("en", "ui", uiEn);
  emit("en", "pages", pagesEs);
  emit("es", "core", coreEs);
  emit("es", "tracking", trackingEs);
  emit("es", "ui", uiEs);
  emit("es", "pages", pagesEs);

  const aggEn = `import core from "./en/core.js";
import tracking from "./en/tracking.js";
import ui from "./en/ui.js";
import pages from "./en/pages.js";

/** Default UI language — English (composed from ./en/*) */
export default {
  ...core,
  ...tracking,
  ...ui,
  ...pages,
};
`;

  const aggEs = `import core from "./es/core.js";
import tracking from "./es/tracking.js";
import ui from "./es/ui.js";
import pages from "./es/pages.js";

/** Spanish UI (composed from ./es/*) */
export default {
  ...core,
  ...tracking,
  ...ui,
  ...pages,
};
`;

  fs.writeFileSync(path.join(localesDir, "en.js"), aggEn);
  fs.writeFileSync(path.join(localesDir, "es.js"), aggEs);

  console.log("Locale split OK: en/es core, tracking, ui, pages + en.js / es.js aggregators.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
