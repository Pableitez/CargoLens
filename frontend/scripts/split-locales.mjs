/**
 * Regenerates locales/en/*.js and locales/es/*.js from the composed en.js / es.js tree.
 * Run: node scripts/split-locales.mjs
 *
 * Note: en.js / es.js must already import modules + marketing. This script only splits
 * core, ui, and pages chunks used for maintenance — not a full locale generator.
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
  LINKED_CARRIER_BOOKINGS:
    "Cannot delete this shipper booking because one or more carrier bookings are linked to it.",
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
  LINKED_CARRIER_BOOKINGS:
    "No se puede eliminar esta reserva shipper porque tiene reservas naviera vinculadas.",
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

  const coreKeys = [
    "brand",
    "seo",
    "howItWorks",
    "sidebar",
    "accountModal",
    "language",
    "workspace",
    "auth",
    "mainLayout",
    "toast",
    "pageTitle",
    "error",
    "skipLink",
    "onboarding",
    "apiBanner",
    "commandPalette",
    "notifications",
    "backgroundJobs",
    "changelog",
    "legal",
    "notFound",
  ];

  const coreEn = pick(en, coreKeys);
  coreEn.apiErrors = enApiErrors;
  coreEn.routeLoading = en.routeLoading;

  const coreEs = pick(es, coreKeys);
  coreEs.apiErrors = esApiErrors;
  coreEs.routeLoading = es.routeLoading;

  const uiEn = pick(en, ["components", "moduleList"]);
  const uiEs = pick(es, ["components", "moduleList"]);

  const pagesEn = pick(en, ["dashboardHome", "messagesPage"]);
  const pagesEs = pick(es, ["dashboardHome", "messagesPage"]);

  emit("en", "core", coreEn);
  emit("en", "ui", uiEn);
  emit("en", "pages", pagesEn);
  emit("es", "core", coreEs);
  emit("es", "ui", uiEs);
  emit("es", "pages", pagesEs);

  console.log("Locale split OK: en/es core, ui, pages (modules + marketing unchanged in en.js / es.js).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
