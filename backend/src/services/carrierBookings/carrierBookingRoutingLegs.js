const TRANSPORT_MODES = new Set(["road", "ocean", "rail", "transshipment"]);

function normalizeLocationCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function inferLegTransportMode({ origin, destination, legIndex, chain, pol, pod, por, del }) {
  const polIdx = pol ? chain.indexOf(pol) : -1;
  const podIdx = pod ? chain.indexOf(pod) : -1;

  if (por && pol && origin === por && destination === pol && por !== pol) {
    return "road";
  }
  if (pod && del && origin === pod && destination === del && pod !== del) {
    return "road";
  }
  if (polIdx >= 0 && podIdx >= 0 && legIndex >= polIdx && legIndex < podIdx) {
    if (origin === pol && destination === pod) return "ocean";
    if (legIndex > polIdx && legIndex < podIdx) return "transshipment";
    return "ocean";
  }
  if (pol && (origin === pol || destination === pol)) return "ocean";
  if (pod && (origin === pod || destination === pod)) return "ocean";
  return "road";
}

/**
 * Build ordered routing legs from INTTRA-style routing points.
 * @param {Record<string, unknown>|null|undefined} routing
 * @param {{ transhipmentPorts?: string[] }} [options]
 */
export function buildRoutingLegsFromRouting(routing, options = {}) {
  const por = normalizeLocationCode(routing?.placeOfReceipt);
  const pol = normalizeLocationCode(routing?.portOfLoading);
  const pod = normalizeLocationCode(routing?.portOfDischarge);
  const del = normalizeLocationCode(routing?.placeOfDelivery);
  const transhipments = Array.isArray(routing?.transhipmentPorts)
    ? routing.transhipmentPorts.map(normalizeLocationCode).filter(Boolean)
    : Array.isArray(options.transhipmentPorts)
      ? options.transhipmentPorts.map(normalizeLocationCode).filter(Boolean)
      : [];

  const chain = [];
  const push = (code) => {
    if (!code) return;
    if (chain[chain.length - 1] === code) return;
    chain.push(code);
  };

  push(por);
  push(pol);
  for (const port of transhipments) push(port);
  push(pod);
  push(del);

  if (chain.length < 2) return [];

  const legs = [];
  for (let i = 0; i < chain.length - 1; i += 1) {
    const origin = chain[i];
    const destination = chain[i + 1];
    const transportMode = inferLegTransportMode({
      origin,
      destination,
      legIndex: i,
      chain,
      pol,
      pod,
      por,
      del,
    });
    legs.push({
      sequence: i + 1,
      transportMode: TRANSPORT_MODES.has(transportMode) ? transportMode : "ocean",
      originCode: origin,
      destinationCode: destination,
    });
  }

  return legs;
}

function serializeRoutingLeg(leg, index) {
  const etd = leg.etd instanceof Date ? leg.etd.toISOString() : (leg.etd ?? null);
  const eta = leg.eta instanceof Date ? leg.eta.toISOString() : (leg.eta ?? null);
  return {
    sequence: leg.sequence ?? index + 1,
    transportMode: TRANSPORT_MODES.has(String(leg.transportMode ?? "").toLowerCase())
      ? String(leg.transportMode).toLowerCase()
      : "ocean",
    originCode: normalizeLocationCode(leg.originCode ?? leg.origin),
    destinationCode: normalizeLocationCode(leg.destinationCode ?? leg.destination),
    portOfLoading: normalizeLocationCode(leg.portOfLoading ?? leg.originCode ?? leg.origin) || undefined,
    portOfDischarge:
      normalizeLocationCode(leg.portOfDischarge ?? leg.destinationCode ?? leg.destination) || undefined,
    vesselName: String(leg.vesselName ?? "").trim() || undefined,
    voyageNumber: String(leg.voyageNumber ?? "").trim() || undefined,
    etd,
    eta,
  };
}

/**
 * Add deterministic vessel/voyage/ETD/ETA to ocean legs for mock and display.
 * @param {Array<Record<string, unknown>>} legs
 * @param {{ requestReference?: string, requestedDepartureDate?: string|null }} [context]
 */
export function enrichRoutingLegsWithCarrierSchedule(legs, context = {}) {
  const vessels = ["MAERSK SEALAND", "MSC GULSUN", "CMA CGM MARCO POLO", "EVER ACE"];
  const requestReference = String(context.requestReference ?? "CB");
  let oceanIndex = 0;

  return legs.map((leg, index) => {
    const base = serializeRoutingLeg(leg, index);
    const isOcean = base.transportMode === "ocean" || base.transportMode === "transshipment";
    if (!isOcean) {
      return {
        ...base,
        portOfLoading: base.originCode,
        portOfDischarge: base.destinationCode,
        vesselName: "",
        voyageNumber: "",
        etd: null,
        eta: null,
      };
    }

    const etdBase = context.requestedDepartureDate ? new Date(context.requestedDepartureDate) : new Date();
    const etd = Number.isNaN(etdBase.getTime()) ? new Date() : etdBase;
    const eta = new Date(etd);
    eta.setDate(eta.getDate() + (base.transportMode === "transshipment" ? 5 : 14 + oceanIndex * 2));
    const suffix = `${base.originCode.slice(-3)}${base.destinationCode.slice(-3)}-${String(oceanIndex + 1).padStart(2, "0")}`;

    oceanIndex += 1;
    return {
      ...base,
      portOfLoading: base.originCode,
      portOfDischarge: base.destinationCode,
      vesselName: vessels[(oceanIndex - 1) % vessels.length],
      voyageNumber: `${
        requestReference
          .replace(/[^A-Z0-9]/gi, "")
          .slice(-6)
          .toUpperCase() || "VY"
      }-${suffix}`,
      etd: etd.toISOString(),
      eta: eta.toISOString(),
    };
  });
}

export function resolveCarrierBookingRoutingLegs(doc) {
  if (Array.isArray(doc?.routingLegs) && doc.routingLegs.length > 0) {
    return doc.routingLegs.map((leg, index) => serializeRoutingLeg(leg, index));
  }

  const fromResponse = doc?.lastResponse?.routingLegs;
  if (Array.isArray(fromResponse) && fromResponse.length > 0) {
    return fromResponse.map((leg, index) => serializeRoutingLeg(leg, index));
  }

  const derived = buildRoutingLegsFromRouting({
    placeOfReceipt: doc?.placeOfReceipt,
    portOfLoading: doc?.portOfLoading,
    portOfDischarge: doc?.portOfDischarge,
    placeOfDelivery: doc?.placeOfDelivery,
  });

  if (derived.length === 0) return [];

  const hasCarrierSchedule =
    doc?.status === "acknowledged" || doc?.status === "confirmed" || doc?.submittedAt;

  if (!hasCarrierSchedule) return derived;

  return enrichRoutingLegsWithCarrierSchedule(derived, {
    requestReference: doc?.requestReference,
    requestedDepartureDate: doc?.requestedDepartureDate,
  });
}
