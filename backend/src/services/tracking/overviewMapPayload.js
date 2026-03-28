// Datos listos para mapa / snapshot a partir del detalle Sinay v2.

import { normalizeLatLng } from "../../utils/coords.js";

const STATUS_LABELS = {
  IN_TRANSIT: "In transit",
  AT_PORT: "At port",
  ARRIVED: "Arrived",
  DELIVERED: "Delivered",
  EMPTY_RETURN: "Empty return",
  UNKNOWN: "Unknown",
};

function mapShippingStatus(raw) {
  const s = String(raw ?? "UNKNOWN").toUpperCase();
  if (s.includes("TRANSIT")) return { code: "IN_TRANSIT", label: STATUS_LABELS.IN_TRANSIT };
  if (s.includes("DELIVER")) return { code: "DELIVERED", label: STATUS_LABELS.DELIVERED };
  if (s.includes("PORT") || s.includes("BERTH")) return { code: "AT_PORT", label: STATUS_LABELS.AT_PORT };
  return { code: s, label: STATUS_LABELS[s] ?? raw ?? STATUS_LABELS.UNKNOWN };
}

// Tramo POL/POD + mejor fecha conocida (real o ETA predictivo).
function segmentSchedule(seg) {
  if (!seg?.location) return { port: "—", locode: null, date: null };
  const loc = seg.location;
  const port = loc.name || loc.locode || "—";
  const date = seg.date ?? seg.predictiveEta ?? null;
  return { port, locode: loc.locode ?? null, date };
}

function pickPositionStrict(detail) {
  const aisPos =
    detail?.containers?.[0]?.routeData?.ais?.data?.lastVesselPosition ??
    detail?.routeData?.ais?.data?.lastVesselPosition ??
    detail?.ais?.data?.lastVesselPosition;

  if (aisPos?.lat != null && aisPos?.lng != null) {
    const p = normalizeLatLng(aisPos.lat, aisPos.lng);
    if (p) return p;
  }

  const v0 = detail?.vessels?.[0];
  if (v0 != null) {
    const fromV = normalizeLatLng(v0.latitude ?? v0.lat, v0.longitude ?? v0.lng);
    if (fromV) return fromV;
  }

  const events = detail?.containers?.[0]?.events ?? [];
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const lat = events[i]?.location?.coordinates?.lat;
    const lng = events[i]?.location?.coordinates?.lng;
    const p = normalizeLatLng(lat, lng);
    if (p) return p;
  }

  const pod = detail?.route?.pod?.location?.coordinates;
  if (pod?.lat != null && pod?.lng != null) {
    const p = normalizeLatLng(pod.lat, pod.lng);
    if (p) return p;
  }

  return null;
}

function extractRoutePathsFromSegments(detail) {
  const rd = detail?.containers?.[0]?.routeData ?? detail?.routeData;
  const segs = rd?.routeSegments;
  if (!Array.isArray(segs)) return [];
  const out = [];
  for (const s of segs) {
    const path = s?.path;
    if (!Array.isArray(path) || path.length < 2) continue;
    const pts = [];
    for (const p of path) {
      if (p?.lat != null && p?.lng != null) pts.push([Number(p.lat), Number(p.lng)]);
    }
    if (pts.length >= 2) out.push(pts);
  }
  return out;
}

// Polilínea por cadena de localizaciones si no hay segmentos de ruta.
function extractLocationChain(detail) {
  const list = detail.locations;
  if (!Array.isArray(list) || list.length < 2) return [];
  const pts = list
    .map((loc) =>
      loc?.coordinates?.lat != null && loc?.coordinates?.lng != null
        ? [Number(loc.coordinates.lat), Number(loc.coordinates.lng)]
        : null
    )
    .filter(Boolean);
  return pts.length >= 2 ? [pts] : [];
}

// Polilíneas: segmentos Sinay o, si no, cadena de puntos (mapa resumen + tracking unitario).
export function extractRoutePathsForDetail(detail) {
  let routePaths = extractRoutePathsFromSegments(detail);
  if (routePaths.length === 0) {
    routePaths = extractLocationChain(detail);
  }
  return routePaths;
}

export function buildOverviewFromDetail(detail) {
  const meta = detail.metadata ?? {};
  const container = detail.containers?.[0];
  const vessel =
    detail.vessels?.[0] ?? container?.events?.find((e) => e?.vessel)?.vessel ?? {};

  const routePaths = extractRoutePathsForDetail(detail);

  const position = pickPositionStrict(detail);

  const route = detail.route ?? {};
  const polSeg = segmentSchedule(route.pol);
  const podSeg = segmentSchedule(route.pod);
  const st = mapShippingStatus(meta.shippingStatus ?? container?.status);

  return {
    position,
    status: meta.shippingStatus ?? container?.status ?? "UNKNOWN",
    statusLabel: st.label,
    vesselName: vessel?.name ?? null,
    imo: vessel?.imo != null ? String(vessel.imo) : "",
    mmsi: vessel?.mmsi != null ? String(vessel.mmsi) : "",
    flag: vessel?.flag ?? "",
    routePaths,
    polPort: polSeg.port,
    polLocode: polSeg.locode,
    etdAt: polSeg.date,
    podPort: podSeg.port,
    podLocode: podSeg.locode,
    etaAt: podSeg.date,
  };
}
