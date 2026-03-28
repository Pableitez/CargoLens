import { getEnv } from "../config/env.js";
import { isDbConnected } from "../db.js";
import { buildVesselRowsFromSavedContainers } from "../services/vessels/vesselsFromSavedContainers.js";
import { buildMockVesselSearch } from "../services/vessels/sinayVesselClient.js";
import { respondSafecubeVesselSearch } from "../services/vessels/vesselSearchHandlers.js";

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
    const env = getEnv();

    if (env.safecubeApiKey) {
      return respondSafecubeVesselSearch(res, q, env);
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
