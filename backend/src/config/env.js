// Lectura y defaults de variables de entorno (JWT, Mongo, INTTRA).

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
      console.warn("[CORS] CLIENT_ORIGIN debe ser una URL http(s); se ignora y se usa CORS permisivo.");
      return true;
    }
    return raw;
  } catch {
    console.warn(
      `[CORS] CLIENT_ORIGIN no es una URL válida (${raw.slice(0, 64)}…). ` +
        "Corrígela en Render (p. ej. https://naolab.pages.dev). Mientras tanto se usa CORS permisivo."
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
  if (!jwtSecret && nodeEnv === "production") {
    throw new Error("JWT_SECRET must be set in production.");
  }

  return {
    nodeEnv,
    port: Number(process.env.PORT) || 4000,
    mongoUri: process.env.MONGODB_URI ?? "",
    jwtSecret,
    clientOrigin: process.env.CLIENT_ORIGIN ?? "",
    allowOpenRegistration: process.env.ALLOW_OPEN_REGISTRATION === "true" || nodeEnv === "development",

    // INTTRA carrier booking (Transport). mock = respuesta simulada sin credenciales.
    inttraApiKey: String(process.env.INTTRA_API_KEY ?? "").trim(),
    inttraApiBase: process.env.INTTRA_API_BASE ?? "https://api.inttra.com",
    carrierBookingMode: String(process.env.CARRIER_BOOKING_MODE ?? "mock")
      .trim()
      .toLowerCase(),
  };
}
