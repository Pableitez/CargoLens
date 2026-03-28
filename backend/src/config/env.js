// Lectura y defaults de variables de entorno (JWT, Mongo, Sinay, AISHub).

/**
 * Valor para `cors({ origin })`. Si CLIENT_ORIGIN no es una URL http(s) válida
 * (p. ej. se pegó un ID por error en Render), el navegador rechaza la cabecera;
 * en ese caso hacemos fallback a `true` (reflejar el Origin de la petición) y avisamos en log.
 */
export function resolveCorsOrigin() {
  const raw = String(process.env.CLIENT_ORIGIN ?? "").trim();
  if (!raw) return true;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      console.warn(
        "[CORS] CLIENT_ORIGIN debe ser una URL http(s); se ignora y se usa CORS permisivo."
      );
      return true;
    }
    return raw;
  } catch {
    console.warn(
      `[CORS] CLIENT_ORIGIN no es una URL válida (${raw.slice(0, 64)}…). ` +
        "Corrígela en Render (p. ej. https://cargolens-cfh.pages.dev). Mientras tanto se usa CORS permisivo."
    );
    return true;
  }
}

export function getEnv() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  let jwtSecret = process.env.JWT_SECRET ?? "";
  if (!jwtSecret && nodeEnv === "development") {
    jwtSecret = "dev-insecure-jwt-secret-change-me";
  }

  return {
    nodeEnv,
    port: Number(process.env.PORT) || 4000,
    mongoUri: process.env.MONGODB_URI ?? "",
    jwtSecret,
    clientOrigin: process.env.CLIENT_ORIGIN ?? "",
    // Misma clave que en Developers → API Credentials (app.safecube.ai).
    safecubeApiKey: String(process.env.SAFECUBE_API_KEY ?? "").trim(),
    // Base API Puertos y Buques Sinay v1.
    safecubeVesselBase:
      process.env.SAFECUBE_VESSEL_BASE ?? "https://api.sinay.ai/ports-vessels/api/v1",

    // Vessels Intelligence (última posición AIS); distinto del listado Puertos y Buques.
    safecubeVesselIntelBase:
      process.env.SAFECUBE_VESSEL_INTEL_BASE ?? "https://api.sinay.ai/vessels-intelligence/api/v1",
    safecubeVesselIntelPositionPath:
      String(process.env.SAFECUBE_VESSEL_INTEL_POSITION_PATH ?? "/vessel-position").trim() ||
      "/vessel-position",
    // Tras listar buques, enriquecer con GET …/vessel-position (producto en la clave).
    safecubeVesselIntelEnrich: process.env.SAFECUBE_VESSEL_INTEL_ENRICH === "true",

    // AISHub: posiciones AIS gratuitas si Sinay no devuelve coordenadas.
    aishubUsername: String(process.env.AISHUB_USERNAME ?? "").trim(),
    // false fuerza a no usar AISHub aunque haya usuario.
    aishubEnrich: process.env.AISHUB_ENRICH !== "false",
  };
}
