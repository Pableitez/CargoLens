import type { CarrierBookingRoutingLeg, CarrierBookingRoutingLegMode } from "./types";

const TRANSPORT_MODES = new Set<CarrierBookingRoutingLegMode>(["road", "ocean", "rail", "transshipment"]);

function normalizeLocationCode(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function inferLegTransportMode({
  origin,
  destination,
  legIndex,
  chain,
  pol,
  pod,
  por,
  del,
}: {
  origin: string;
  destination: string;
  legIndex: number;
  chain: string[];
  pol: string;
  pod: string;
  por: string;
  del: string;
}): CarrierBookingRoutingLegMode {
  const polIdx = pol ? chain.indexOf(pol) : -1;
  const podIdx = pod ? chain.indexOf(pod) : -1;

  if (por && pol && origin === por && destination === pol && por !== pol) return "road";
  if (pod && del && origin === pod && destination === del && pod !== del) return "road";
  if (polIdx >= 0 && podIdx >= 0 && legIndex >= polIdx && legIndex < podIdx) {
    if (origin === pol && destination === pod) return "ocean";
    if (legIndex > polIdx && legIndex < podIdx) return "transshipment";
    return "ocean";
  }
  if (pol && (origin === pol || destination === pol)) return "ocean";
  if (pod && (origin === pod || destination === pod)) return "ocean";
  return "road";
}

export function buildRoutingLegsFromRouting(routing: {
  placeOfReceipt?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  placeOfDelivery?: string;
  transhipmentPorts?: string[];
}): CarrierBookingRoutingLeg[] {
  const por = normalizeLocationCode(routing.placeOfReceipt);
  const pol = normalizeLocationCode(routing.portOfLoading);
  const pod = normalizeLocationCode(routing.portOfDischarge);
  const del = normalizeLocationCode(routing.placeOfDelivery);
  const transhipments = (routing.transhipmentPorts ?? []).map(normalizeLocationCode).filter(Boolean);

  const chain: string[] = [];
  const push = (code: string) => {
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

  const legs: CarrierBookingRoutingLeg[] = [];
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

export function routingLegModeLabel(mode: CarrierBookingRoutingLegMode, t: (key: string) => string): string {
  return t(`carrierBookingsPage.routingLegMode.${mode}`);
}
