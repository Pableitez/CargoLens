import type { OrderStatus, OrderTransportMode } from "./types";

import { formatLocationLabel } from "../../utils/locationUtils";

type TranslateFn = (key: string) => string;

export function formatOrderDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function orderStatusLabel(status: OrderStatus, t: TranslateFn): string {
  return t(`ordersPage.status.${status}`);
}

export function orderStatusClass(status: OrderStatus): string {
  return `order-status order-status--${status}`;
}

export function transportModeLabel(mode: OrderTransportMode, t: TranslateFn): string {
  if (!mode) return "—";
  return t(`ordersPage.transportMode.${mode}`);
}

export function formatOrderRoute(order: {
  portOfLoading: string;
  portOfDischarge: string;
  placeOfReceipt: string;
  placeOfDelivery: string;
}): { origin: string; destination: string } {
  const originCode = order.portOfLoading || order.placeOfReceipt;
  const destinationCode = order.portOfDischarge || order.placeOfDelivery;
  return {
    origin: originCode ? formatLocationLabel(originCode) : "—",
    destination: destinationCode ? formatLocationLabel(destinationCode) : "—",
  };
}
