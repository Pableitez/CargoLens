// Lectura y defaults de variables de entorno (JWT, Mongo, Sinay, AISHub).
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
