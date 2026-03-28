import { getEnv } from "../../config/env.js";

// Sinay Puertos y Buques v1 (misma API_KEY que tracking si el plan lo incluye).
export async function searchVessels(apiKey, query) {
  const q = String(query ?? "").trim();
  if (q.length < 3) {
    const err = new Error("Enter at least 3 characters (vessel name, MMSI, or IMO).");
    err.status = 400;
    throw err;
  }

  const { safecubeVesselBase } = getEnv();
  const base = safecubeVesselBase.replace(/\/$/, "");
  const params = new URLSearchParams({
    vesselNameOrCode: q,
    numberOfResult: "10",
  });
  const url = `${base}/vessels?${params.toString()}`;

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
    body = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(body?.message || body?.error || `Vessel API HTTP ${res.status}`);
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    err.body = body;
    throw err;
  }

  return body;
}

export function buildMockVesselSearch(query) {
  const q = String(query ?? "").trim() || "VESSEL";
  return {
    source: "mock",
    query: q,
    vessels: [
      {
        name: `Demo vessel (${q.slice(0, 12)})`,
        imo: "9234567",
        mmsi: "123456789",
        flag: "PA",
        vesselType: "Container Ship",
        latitude: 36.2,
        longitude: -6.1,
        speed: 12.5,
        course: 180,
        lastUpdate: new Date().toISOString(),
      },
    ],
  };
}

// Normaliza respuesta Sinay (vesselsList y formas antiguas).
export function normalizeVesselSearch(body) {
  const raw =
    body?.vesselsList ??
    body?.vessels ??
    body?.data ??
    body?.results ??
    body?.content ??
    (Array.isArray(body) ? body : []);
  const list = Array.isArray(raw) ? raw : [];
  return list.map((v) => ({
    name: v.name ?? v.vesselName ?? v.shipName ?? "—",
    imo: v.imo != null ? String(v.imo) : "",
    mmsi: v.mmsi != null ? String(v.mmsi) : "",
    flag: v.flag ?? v.country ?? "",
    vesselType: v.vesselType ?? v.type ?? v.shipType ?? "",
    latitude: v.latitude ?? v.lat ?? v?.position?.latitude,
    longitude: v.longitude ?? v.lon ?? v?.position?.longitude,
    speed: v.speed ?? v?.ais?.speed,
    lastUpdate: v.lastUpdate ?? v.timestamp ?? v.updatedAt,
  }));
}
