import { fetchAishubPositionByMmsi } from "./aishubVesselClient.js";
import { fetchVesselLastPosition } from "./sinayVesselIntelClient.js";
import { getEnv } from "../../config/env.js";

function hasCoords(v) {
  return (
    v.latitude != null &&
    v.longitude != null &&
    Number.isFinite(Number(v.latitude)) &&
    Number.isFinite(Number(v.longitude))
  );
}

async function enrichIntelSlice(apiKey, out, max, delayMs) {
  for (let i = 0; i < max; i += 1) {
    const v = out[i];
    if (hasCoords(v)) continue;

    const imo = v.imo && String(v.imo).trim() !== "" ? v.imo : null;
    const mmsi = v.mmsi && String(v.mmsi).trim() !== "" ? v.mmsi : null;
    if (!imo && !mmsi) continue;

    try {
      const pos = await fetchVesselLastPosition(apiKey, { imo, mmsi });
      if (pos) {
        out[i] = {
          ...out[i],
          latitude: pos.latitude,
          longitude: pos.longitude,
          speed: pos.speed ?? out[i].speed,
          course: pos.course,
          lastUpdate: pos.lastUpdate ?? out[i].lastUpdate,
          positionSource: "vessels_intelligence",
        };
      }
    } catch {
      /* network / unexpected */
    }

    if (delayMs > 0 && i < max - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function enrichFirstAishubGap(aishubUsername, out) {
  for (let i = 0; i < out.length; i += 1) {
    if (hasCoords(out[i])) continue;
    const mmsi =
      out[i].mmsi && String(out[i].mmsi).trim() !== "" ? String(out[i].mmsi).trim() : "";
    if (!mmsi) continue;

    try {
      const pos = await fetchAishubPositionByMmsi(aishubUsername, mmsi);
      if (pos) {
        out[i] = {
          ...out[i],
          latitude: pos.latitude,
          longitude: pos.longitude,
          speed: pos.speed ?? out[i].speed,
          course: pos.course,
          lastUpdate: pos.lastUpdate ?? out[i].lastUpdate,
          positionSource: "aishub",
        };
      }
    } catch {
      /* ignore */
    }
    break;
  }
}

// Rellena coordenadas en filas de buque: 1) Vessels Intelligence 2) AISHub por MMSI (límites de ratio).
export async function enrichVesselsWithIntelPositions(apiKey, vessels, options = {}) {
  const max = Math.min(
    Number(options.maxVessels) > 0 ? Number(options.maxVessels) : 8,
    vessels.length
  );
  const delayMs = Number(options.delayMs) >= 0 ? Number(options.delayMs) : 80;

  const { safecubeVesselIntelEnrich, aishubUsername, aishubEnrich } = getEnv();

  const out = vessels.map((v) => ({ ...v }));

  if (safecubeVesselIntelEnrich && apiKey) {
    await enrichIntelSlice(apiKey, out, max, delayMs);
  }

  if (aishubEnrich && aishubUsername) {
    await enrichFirstAishubGap(aishubUsername, out);
  }

  return out;
}
