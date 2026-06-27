import type { Order } from "./types";
import { formatOrderRoute, orderStatusLabel, transportModeLabel } from "./orderUtils";

export function normalizeCustomerKey(customer: string): string {
  return customer.trim().toLowerCase();
}

export function isOrderBookable(order: Order): boolean {
  return order.status !== "cancelled" && order.status !== "booked";
}

export function buildOrderSearchHaystack(order: Order, t: (key: string) => string): string[] {
  const route = formatOrderRoute(order);
  return [
    order.orderNumber,
    order.externalBusinessId,
    order.customer,
    order.shipper,
    order.consignee,
    route.origin,
    route.destination,
    order.placeOfReceipt,
    order.portOfLoading,
    order.portOfDischarge,
    order.placeOfDelivery,
    transportModeLabel(order.transportMode, t),
    orderStatusLabel(order.status, t),
    ...order.lines.map((line) => [line.lineKey, line.sku, line.description].join(" ")),
  ];
}

export function canSelectOrderForBooking(order: Order, selectedCustomerKey: string | null): boolean {
  if (!isOrderBookable(order)) return false;
  if (!selectedCustomerKey) return true;
  return normalizeCustomerKey(order.customer) === selectedCustomerKey;
}
