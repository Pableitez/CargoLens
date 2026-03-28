import { getEnv } from "../../config/env.js";
import { normalizeLatLng } from "../../utils/coords.js";

// Vessels Intelligence Sinay: última posición AIS (producto aparte del listado).

function pickPositionFromBody(body) {
  if (!body || typeof body !== "object") return null;
  const candidates = [
    body,
    body.data,
    body.position,
    body.lastPosition,
    body.lastVesselPosition,
    body.vesselPosition,
    body.ais?.lastVesselPosition,
    body.ais?.data?.lastVesselPosition,
  ].filter(Boolean);

  for (const o of candidates) {
    const lat = o.latitude ?? o.lat;
    const lng = o.longitude ?? o.lng ?? o.lon;
    const p = normalizeLatLng(lat, lng);
    if (p) {
      const speed = o.speed ?? o.sog ?? o.SOG;
      const course = o.course ?? o.cog ?? o.COG;
      const ts = o.updatedAt ?? o.timestamp ?? o.time ?? o.TIME ?? null;
      return {
        latitude: p.lat,
        longitude: p.lng,
        speed: speed != null && speed !== "" ? Number(speed) : undefined,
        course: course != null && course !== "" ? Number(course) : undefined,
        lastUpdate: ts != null ? String(ts) : undefined,
      };
    }
  }
  return null;
}

// GET posición por IMO o MMSI; header API_KEY como el resto de Sinay.
export async function fetchVesselLastPosition(apiKey, { imo, mmsi }) {
  const imoStr = imo != null ? String(imo).trim() : "";
  const mmsiStr = mmsi != null ? String(mmsi).trim() : "";
  const imoUsable = imoStr && imoStr !== "0" && /^\d{6,8}$/.test(imoStr);
  if (!imoUsable && !mmsiStr) return null;

  const {
    safecubeVesselIntelBase,
    safecubeVesselIntelPositionPath,
  } = getEnv();

  const base = safecubeVesselIntelBase.replace(/\/$/, "");
  const path = safecubeVesselIntelPositionPath.startsWith("/")
    ? safecubeVesselIntelPositionPath
    : `/${safecubeVesselIntelPositionPath}`;

  async function tryFetch(queryKey, queryVal) {
    const params = new URLSearchParams();
    params.set(queryKey, queryVal);
    const url = `${base}${path}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        API_KEY: apiKey,
        Accept: "application/json",
      },
    });
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }
    if (!res.ok) return null;
    return pickPositionFromBody(body);
  }

  if (imoUsable) {
    const pos = await tryFetch("imo", imoStr);
    if (pos) return pos;
  }
  if (mmsiStr) {
    return tryFetch("mmsi", mmsiStr);
  }
  return null;
}
