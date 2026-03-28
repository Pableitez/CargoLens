import { enrichVesselsWithIntelPositions } from "./enrichVesselPositions.js";
import { buildMockVesselSearch, normalizeVesselSearch, searchVessels } from "./sinayVesselClient.js";

/** Búsqueda Sinay + enriquecimiento opcional; respuesta JSON o error HTTP. */
export async function respondSafecubeVesselSearch(res, q, env) {
  const { safecubeApiKey, safecubeVesselIntelEnrich, aishubUsername, aishubEnrich } = env;
  const runPositionEnrich =
    Boolean(aishubUsername && aishubEnrich) || Boolean(safecubeApiKey && safecubeVesselIntelEnrich);

  try {
    const detail = await searchVessels(safecubeApiKey, q);
    let vessels = normalizeVesselSearch(detail);
    if (runPositionEnrich && vessels.length > 0) {
      vessels = await enrichVesselsWithIntelPositions(safecubeApiKey, vessels);
    }
    return res.json({
      source: "safecube",
      query: String(q ?? "").trim(),
      vessels,
      intelEnrichment: safecubeVesselIntelEnrich,
      aishubEnrichment: Boolean(aishubUsername && aishubEnrich),
      empty: vessels.length === 0,
      hint:
        vessels.length === 0
          ? "No vessels matched. Try at least 3 letters of the name, or a full MMSI/IMO."
          : undefined,
      raw: process.env.NODE_ENV === "development" ? detail : undefined,
    });
  } catch (err) {
    const code = Number(err.status);
    const status = code >= 400 && code < 600 ? code : 502;
    const isAuth = code === 401 || code === 403;
    const hint = isAuth
      ? "Container Tracking and Ports & Vessels are different products. Ask Sinay to enable Ports & Vessels on your API key, or use the Developers portal (developers.sinay.ai)."
      : undefined;
    return res.status(status).json({
      error: "VESSEL_API_ERROR",
      message: err.message || "Vessel search failed.",
      hint,
      details: process.env.NODE_ENV === "development" ? err.body : undefined,
    });
  }
}
