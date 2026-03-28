import { getEnv } from "../config/env.js";
import { isDbConnected } from "../db.js";
import { enrichVesselsWithIntelPositions } from "../services/vessels/enrichVesselPositions.js";
import { buildVesselRowsFromSavedContainers } from "../services/vessels/vesselsFromSavedContainers.js";
import { buildMockVesselSearch, normalizeVesselSearch, searchVessels } from "../services/vessels/sinayVesselClient.js";

export async function getVesselsFromContainers(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        error: "DB_UNAVAILABLE",
        message: "Database not configured or unreachable.",
      });
    }

    const companyId = req.user.companyId;
    const clientId = req.user.clientId ?? null;

    const { vessels, mode, hint } = await buildVesselRowsFromSavedContainers({
      companyId,
      clientId,
    });

    return res.json({
      source: "containers",
      mode,
      vessels,
      empty: vessels.length === 0,
      hint,
      intelEnrichment: false,
      aishubEnrichment: false,
    });
  } catch (err) {
    next(err);
  }
}

export async function getVesselSearch(req, res, next) {
  try {
    const q = req.query.q ?? req.query.search;
    const {
      safecubeApiKey,
      safecubeVesselIntelEnrich,
      aishubUsername,
      aishubEnrich,
    } = getEnv();

    const runPositionEnrich =
      Boolean(aishubUsername && aishubEnrich) ||
      Boolean(safecubeApiKey && safecubeVesselIntelEnrich);

    if (safecubeApiKey) {
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
        const hint =
          isAuth
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

    const mock = buildMockVesselSearch(q);
    return res.json({
      source: "mock",
      query: mock.query,
      vessels: mock.vessels,
    });
  } catch (err) {
    next(err);
  }
}
