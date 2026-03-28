import mongoose from "mongoose";
import { SavedContainer } from "../../models/SavedContainer.js";
import { getEnv } from "../../config/env.js";
import { carrierFromContainerNumber } from "../tracking/carrierFromPrefix.js";
import { buildOverviewFromDetail } from "../tracking/overviewMapPayload.js";
import { fetchSafecubeShipmentWithSealineFallback } from "../tracking/safecubeClient.js";
import { normalizeLatLng } from "../../utils/coords.js";

const MAX_CONTAINERS = 20;
const BETWEEN_MS = 80;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(31, h) + str.charCodeAt(i);
  return Math.abs(h);
}

function dedupKeyFromRow(containerNumber, built) {
  const imo = String(built.imo ?? "").trim();
  const mmsi = String(built.mmsi ?? "").trim();
  if (/^\d{7}$/.test(imo) && imo !== "0000000") return `imo:${imo}`;
  if (/^\d{8,9}$/.test(mmsi)) return `mmsi:${mmsi}`;
  return `cn:${containerNumber}`;
}

// Conteos active/completed agregados por buque.
function lifecycleBreakdownFromSavedRow(savedRow) {
  return savedRow.lifecycleStatus === "completed"
    ? { active: 0, completed: 1 }
    : { active: 1, completed: 0 };
}

function mergeLifecycleBreakdown(a, b) {
  return {
    active: (a?.active ?? 0) + (b?.active ?? 0),
    completed: (a?.completed ?? 0) + (b?.completed ?? 0),
  };
}

function buildDemoVesselsFromRows(rows) {
  return rows.map((r) => {
    const seed = hashSeed(r.containerNumber);
    const lat = 25 + (seed % 80) / 20;
    const lng = -80 + (seed % 120) / 15;
    const routePaths = [
      [
        [lat - 2, lng + 3],
        [lat, lng],
        [lat + 1.5, lng - 4],
      ],
    ];
    return {
      name: `Demo vessel (${r.containerNumber.slice(0, 4)}…)`,
      imo: "",
      mmsi: "",
      flag: "",
      vesselType: "",
      latitude: lat,
      longitude: lng,
      speed: undefined,
      lastUpdate: undefined,
      containerNumbers: [r.containerNumber],
      shipmentStatus: "DEMO",
      positionSource: "mock",
      routePaths,
      lifecycleBreakdown: lifecycleBreakdownFromSavedRow(r),
    };
  });
}

async function mergeSavedRowIntoVessels(merged, row, safecubeApiKey) {
  const cn = row.containerNumber;
  try {
    const carrier = carrierFromContainerNumber(cn);
    const sealineGuess = carrier.id !== "unknown" ? cn.slice(0, 4) : undefined;
    const detail = await fetchSafecubeShipmentWithSealineFallback(safecubeApiKey, cn, sealineGuess);
    const built = buildOverviewFromDetail(detail);
    const key = dedupKeyFromRow(cn, built);
    const lat = built.position?.lat;
    const lng = built.position?.lng;
    const coord = normalizeLatLng(lat, lng);

    const rowOut = {
      name: built.vesselName && built.vesselName.trim() !== "" ? built.vesselName : "—",
      imo: built.imo ?? "",
      mmsi: built.mmsi ?? "",
      flag: built.flag ?? "",
      vesselType: "",
      latitude: coord ? coord.lat : undefined,
      longitude: coord ? coord.lng : undefined,
      speed: undefined,
      lastUpdate: undefined,
      containerNumbers: [cn],
      shipmentStatus: built.status ?? "—",
      positionSource: coord ? "container_tracking" : "none",
    };

    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, rowOut);
      return;
    }
    const nums = [...new Set([...(prev.containerNumbers ?? []), cn])];
    const plat = prev.latitude ?? rowOut.latitude;
    const plng = prev.longitude ?? rowOut.longitude;
    merged.set(key, {
      ...prev,
      name: prev.name === "—" && rowOut.name !== "—" ? rowOut.name : prev.name,
      imo: prev.imo || rowOut.imo,
      mmsi: prev.mmsi || rowOut.mmsi,
      flag: prev.flag || rowOut.flag,
      containerNumbers: nums,
      latitude: plat,
      longitude: plng,
      shipmentStatus: prev.shipmentStatus || rowOut.shipmentStatus,
      positionSource:
        plat != null && plng != null
          ? prev.latitude != null && prev.longitude != null
            ? prev.positionSource
            : rowOut.positionSource
          : "none",
    });
  } catch {
    const key = `err:${cn}`;
    merged.set(key, {
      name: "—",
      imo: "",
      mmsi: "",
      flag: "",
      vesselType: "",
      latitude: undefined,
      longitude: undefined,
      speed: undefined,
      lastUpdate: undefined,
      containerNumbers: [cn],
      shipmentStatus: "—",
      positionSource: "none",
      trackingError: true,
      lifecycleBreakdown: lifecycleBreakdownFromSavedRow(row),
    });
  }
}

// Buques únicos inferidos del tracking de contenedores guardados (AIS/ruta si hay).
export async function buildVesselRowsFromSavedContainers({ companyId, clientId }) {
  const q = { companyId: new mongoose.Types.ObjectId(companyId) };
  if (clientId) {
    q.clientId = new mongoose.Types.ObjectId(clientId);
  }

  const rows = await SavedContainer.find(q).sort({ updatedAt: -1 }).limit(MAX_CONTAINERS).lean();

  if (rows.length === 0) {
    return { mode: "empty", vessels: [], hint: "Save containers in the workspace to see their vessels here." };
  }

  const { safecubeApiKey } = getEnv();

  if (!safecubeApiKey) {
    const vessels = buildDemoVesselsFromRows(rows);
    return {
      mode: "mock",
      vessels,
      hint: "Set SAFECUBE_API_KEY on the server for live vessel names and positions from container tracking.",
    };
  }

  const merged = new Map();

  for (let i = 0; i < rows.length; i += 1) {
    await mergeSavedRowIntoVessels(merged, rows[i], safecubeApiKey);
    if (i < rows.length - 1) await delay(BETWEEN_MS);
  }

  return {
    mode: "live",
    vessels: [...merged.values()],
  };
}
