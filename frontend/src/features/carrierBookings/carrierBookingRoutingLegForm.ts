import { buildRoutingLegsFromRouting } from "./carrierBookingRoutingLegs";
import type { CarrierBookingRequest, CarrierBookingRoutingLeg, CarrierBookingRoutingLegMode } from "./types";

function toInputDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function dateInputToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function legsFromCarrierBookingItem(item: CarrierBookingRequest): CarrierBookingRoutingLeg[] {
  if (item.routingLegs?.length) {
    return item.routingLegs.map((leg) => ({ ...leg }));
  }
  return buildRoutingLegsFromRouting({
    placeOfReceipt: item.placeOfReceipt,
    portOfLoading: item.portOfLoading,
    portOfDischarge: item.portOfDischarge,
    placeOfDelivery: item.placeOfDelivery,
  });
}

export function emptyRoutingLeg(sequence: number): CarrierBookingRoutingLeg {
  return {
    sequence,
    transportMode: "ocean",
    originCode: "",
    destinationCode: "",
    portOfLoading: "",
    portOfDischarge: "",
    vesselName: "",
    voyageNumber: "",
    etd: null,
    eta: null,
  };
}

export function resequenceRoutingLegs(legs: CarrierBookingRoutingLeg[]): CarrierBookingRoutingLeg[] {
  return legs.map((leg, index) => ({ ...leg, sequence: index + 1 }));
}

export function routingLegEtdInput(leg: CarrierBookingRoutingLeg): string {
  return toInputDate(leg.etd);
}

export function routingLegEtaInput(leg: CarrierBookingRoutingLeg): string {
  return toInputDate(leg.eta);
}

export function patchRoutingLeg(
  leg: CarrierBookingRoutingLeg,
  patch: Partial<CarrierBookingRoutingLeg>
): CarrierBookingRoutingLeg {
  const next = { ...leg, ...patch };
  if (patch.portOfLoading !== undefined) {
    next.originCode = patch.portOfLoading;
  }
  if (patch.portOfDischarge !== undefined) {
    next.destinationCode = patch.portOfDischarge;
  }
  if (patch.originCode !== undefined && patch.portOfLoading === undefined) {
    next.portOfLoading = patch.originCode;
  }
  if (patch.destinationCode !== undefined && patch.portOfDischarge === undefined) {
    next.portOfDischarge = patch.destinationCode;
  }
  const isOcean = next.transportMode === "ocean" || next.transportMode === "transshipment";
  if (!isOcean) {
    next.vesselName = "";
    next.voyageNumber = "";
    next.etd = null;
    next.eta = null;
  }
  return next;
}

export function routingLegTransportModes(): CarrierBookingRoutingLegMode[] {
  return ["road", "ocean", "rail", "transshipment"];
}

export { dateInputToIso };
