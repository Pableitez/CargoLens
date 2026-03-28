// Sinay Container Tracking v2 → DTO unificado para el cliente.

import { extractRoutePathsForDetail } from "./overviewMapPayload.js";
import { normalizeLatLng } from "../../utils/coords.js";

function pickPosition(detail) {
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

  return { lat: 20, lng: -40 };
}

function pickAisMeta(detail) {
  const d =
    detail?.containers?.[0]?.routeData?.ais?.data ??
    detail?.routeData?.ais?.data ??
    detail?.ais?.data;
  if (!d?.lastVesselPosition) return null;
  const p = normalizeLatLng(d.lastVesselPosition.lat, d.lastVesselPosition.lng);
  if (!p) return null;
  return {
    lastVesselPosition: p,
    updatedAt: d.lastVesselPosition?.updatedAt ?? d.lastEvent?.date ?? null,
  };
}

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

function milestoneFromSegment(seg, fallbackLabel) {
  if (!seg?.location) return null;
  const loc = seg.location;
  const title = [loc.name, loc.state, loc.country].filter(Boolean).join(", ") || loc.locode || "—";
  return {
    key: fallbackLabel,
    locode: loc.locode ?? null,
    title,
    date: seg.date ?? null,
    actual: seg.actual === true,
    predictiveEta: seg.predictiveEta ?? null,
  };
}

function mapLocations(detail) {
  const list = detail.locations;
  if (!Array.isArray(list)) return [];
  return list.map((loc, i) => ({
    id: `loc-${i}`,
    name: loc.name,
    locode: loc.locode,
    country: loc.country,
    lat: loc.coordinates?.lat ?? null,
    lng: loc.coordinates?.lng ?? null,
  }));
}

export function mapSafecubeToApp(detail) {
  const meta = detail.metadata ?? {};
  const container = detail.containers?.[0];
  const vessel =
    detail.vessels?.[0] ?? container?.events?.find((e) => e?.vessel)?.vessel ?? {};

  const st = mapShippingStatus(meta.shippingStatus ?? container?.status);

  const events = container?.events ?? [];
  const timeline = events.map((ev, i) => ({
    id: `sf-${i}`,
    label: ev.description ?? ev.eventCode ?? "Event",
    code: ev.eventCode ?? null,
    place:
      [ev.location?.name, ev.location?.country].filter(Boolean).join(", ") ||
      ev.location?.locode ||
      "—",
    date: ev.date ?? new Date().toISOString(),
    actual: ev.isActual !== false,
    routeType: ev.routeType ?? null,
  }));

  const route = detail.route ?? {};
  const routeMilestones = [
    milestoneFromSegment(route.prepol, "Pre-carriage"),
    milestoneFromSegment(route.pol, "Port of loading"),
    milestoneFromSegment(route.pod, "Port of discharge"),
    milestoneFromSegment(route.postpod, "On-carriage"),
  ].filter(Boolean);

  const pod = route.pod;
  const etaDate = pod?.date ?? pod?.predictiveEta ?? meta.updatedAt;
  const pos = pickPosition(detail);
  const aisMeta = pickAisMeta(detail);
  const routePaths = extractRoutePathsForDetail(detail);

  return {
    containerNumber: meta.shipmentNumber ?? container?.number ?? "",
    carrier: {
      id: (meta.sealine ?? "unknown").toLowerCase(),
      name: meta.sealineName ?? meta.sealine ?? "—",
      scac: meta.sealine ?? null,
    },
    shipmentType: meta.shipmentType ?? "CT",
    status: st.code,
    statusLabel: st.label,
    rawShippingStatus: meta.shippingStatus ?? container?.status ?? null,
    summary: `Source: Safecube / Sinay · ${meta.shippingStatus ?? container?.status ?? ""}`,
    updatedAt: meta.updatedAt ?? null,
    container: {
      number: container?.number ?? meta.shipmentNumber ?? "",
      isoCode: container?.isoCode ?? null,
      sizeType: container?.sizeType ?? null,
      status: container?.status ?? null,
    },
    vessel: {
      name: vessel?.name ?? "—",
      imo: vessel?.imo != null ? String(vessel.imo) : null,
      mmsi: vessel?.mmsi != null ? String(vessel.mmsi) : null,
      callSign: vessel?.callSign ?? null,
      flag: vessel?.flag ?? null,
    },
    position: pos,
    positionSource: aisMeta ? "ais" : "event_or_pod",
    ais: aisMeta,
    coordinatesLabel:
      pos.lat != null && pos.lng != null
        ? `${Number(pos.lat).toFixed(5)}°, ${Number(pos.lng).toFixed(5)}°`
        : null,
    eta: {
      port: pod?.location?.name ?? pod?.location?.locode ?? "—",
      locode: pod?.location?.locode ?? null,
      date: etaDate ?? new Date().toISOString(),
    },
    routeMilestones,
    locations: mapLocations(detail),
    timeline: timeline.length ? timeline : [],
    // Polilíneas [[lat,lng], …] para mapa (misma lógica que resumen workspace).
    routePaths,
    source: "safecube",
  };
}
