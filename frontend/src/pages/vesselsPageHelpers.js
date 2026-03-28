/** Etiquetas y textos de ayuda para la página Vessels (tests + reutilización). */

export function vesselResultsSourceLabel(data) {
  if (!data) return null;
  if (data.source === "containers" && data.mode === "live") return "From saved containers · Sinay tracking";
  if (data.source === "containers" && data.mode === "mock") {
    return "Demo · from saved containers (add API key for live)";
  }
  if (data.source === "safecube") return "Live · Sinay";
  if (data.source === "mock") return "Demo · add API key for live";
  return null;
}

export function vesselResultsMapDataSource(data) {
  if (!data) return null;
  if (data.source === "containers") return data.mode === "mock" ? "mock" : "safecube";
  if (data.source === "safecube") return "safecube";
  if (data.source === "mock") return "mock";
  return null;
}

export function vesselNoCoordsFootnote(data) {
  if (data?.source === "containers") {
    return "No map position yet: tracking may not include AIS for these shipments, or the line has not published coordinates.";
  }
  if (data?.source === "safecube" && data?.aishubEnrichment) {
    return "No AIS position for the first result’s MMSI (AISHub). The ship may be outside community coverage, or wait 1+ minute between searches (AISHub rate limit).";
  }
  if (data?.source === "safecube" && data?.intelEnrichment) {
    return "Sinay Vessels Intelligence returned no coordinates. Set AISHUB_USERNAME in backend/.env for a free AIS fallback, or confirm your Sinay plan.";
  }
  if (data?.source === "safecube" && !data?.intelEnrichment && !data?.aishubEnrichment) {
    return "No positions on the map: set SAFECUBE_VESSEL_INTEL_ENRICH=true and/or AISHUB_USERNAME (see backend .env.example).";
  }
  return "No coordinates in these results—the map needs AIS latitude/longitude from the API.";
}
