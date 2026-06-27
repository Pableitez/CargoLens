import type { ShipperBookingStatus, ShipperBookingTransportMode } from "./types";

import { formatLocationLabel } from "../../utils/locationUtils";

type TranslateFn = (key: string) => string;

export function formatBookingDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function bookingStatusLabel(status: ShipperBookingStatus, t: TranslateFn): string {
  return t(`shipperBookingsPage.status.${status}`);
}

export function bookingStatusClass(status: ShipperBookingStatus): string {
  return `order-status order-status--${status}`;
}

export function transportModeLabel(mode: ShipperBookingTransportMode, t: TranslateFn): string {
  if (!mode) return "—";
  return t(`shipperBookingsPage.transportMode.${mode}`);
}

export function formatBookingRoute(booking: {
  portOfLoading: string;
  portOfDischarge: string;
  placeOfReceipt: string;
  placeOfDelivery: string;
}): { origin: string; destination: string } {
  const originCode = booking.portOfLoading || booking.placeOfReceipt;
  const destinationCode = booking.portOfDischarge || booking.placeOfDelivery;
  return {
    origin: originCode ? formatLocationLabel(originCode) : "—",
    destination: destinationCode ? formatLocationLabel(destinationCode) : "—",
  };
}
