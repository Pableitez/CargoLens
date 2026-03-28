import mongoose from "mongoose";
import { getEnv } from "../config/env.js";
import { SavedContainer } from "../models/SavedContainer.js";
import { buildMockShipment } from "../services/tracking/buildMockShipment.js";
import { carrierFromContainerNumber } from "../services/tracking/carrierFromPrefix.js";
import { mapSafecubeToApp } from "../services/tracking/mapSafecubeToApp.js";
import { fetchSafecubeShipmentWithSealineFallback } from "../services/tracking/safecubeClient.js";
import { devError } from "../utils/devLog.js";

// Tras track OK: lifecycle active; si API live, entrySource api. Mock no toca origen. Upsert staff sin fila previa.
async function markSavedContainerAfterTrack(req, containerNumberUpper, { viaLiveApi }) {
  if (!req.user?.companyId) return;
  const companyId = new mongoose.Types.ObjectId(req.user.companyId);
  const baseQ = { companyId, containerNumber: containerNumberUpper };
  if (req.user.clientId) {
    baseQ.clientId = new mongoose.Types.ObjectId(req.user.clientId);
  }
  const $set = { lifecycleStatus: "active" };
  if (viaLiveApi) {
    $set.entrySource = "api";
  }
  try {
    if (viaLiveApi && !req.user.clientId) {
      await SavedContainer.findOneAndUpdate(
        { companyId, containerNumber: containerNumberUpper },
        {
          $set: $set,
          $setOnInsert: {
            companyId,
            containerNumber: containerNumberUpper,
            clientName: "",
            notes: "",
          },
        },
        { upsert: true }
      );
    } else {
      await SavedContainer.updateOne(baseQ, { $set });
    }
  } catch (err) {
    devError("markSavedContainerAfterTrack", err);
  }
}

export async function searchTracking(req, res, next) {
  try {
    const q = req.query.q ?? req.query.container;
    if (!q || String(q).trim().length < 4) {
      return res.status(400).json({
        error: "INVALID_QUERY",
        message: "Enter a container number (minimum 4 characters).",
      });
    }

    const cleaned = String(q).trim().toUpperCase().replace(/\s+/g, "");
    const { safecubeApiKey } = getEnv();

    if (safecubeApiKey) {
      const carrier = carrierFromContainerNumber(cleaned);
      // Sinay usa SCAC; prefijo ISO del contenedor a veces no coincide — fallback de sealine.
      const sealineGuess =
        carrier.id !== "unknown" ? cleaned.slice(0, 4) : undefined;
      try {
        const detail = await fetchSafecubeShipmentWithSealineFallback(
          safecubeApiKey,
          cleaned,
          sealineGuess
        );
        const data = mapSafecubeToApp(detail);
        await markSavedContainerAfterTrack(req, cleaned, { viaLiveApi: true });
        return res.json(data);
      } catch (err) {
        const code = Number(err.status);
        const status = code >= 400 && code < 600 ? code : 502;
        return res.status(status).json({
          error: "SAFECUBE_ERROR",
          message: err.message || "Safecube request failed.",
          details: process.env.NODE_ENV === "development" ? err.body : undefined,
        });
      }
    }

    const data = buildMockShipment(q);
    await markSavedContainerAfterTrack(req, cleaned, { viaLiveApi: false });
    return res.json(data);
  } catch (err) {
    next(err);
  }
}
