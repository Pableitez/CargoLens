import * as ordersApi from "../../api/orders";
import type { ShipperBookingLineFormState } from "./types";

export function lineCompositeKey(orderNumber: string, lineKey: string) {
  return `${orderNumber.trim().toUpperCase()}|${lineKey.trim()}`;
}

export function clampBookedQuantity(value: string, maxBookedQuantity?: string): string {
  if (!maxBookedQuantity) return value;
  const max = Number(maxBookedQuantity);
  const qty = Number(value);
  if (Number.isNaN(qty) || Number.isNaN(max)) return value;
  if (qty > max) return String(max);
  return value;
}

export function validateLinkedLineQuantities(
  lines: ShipperBookingLineFormState[],
  t: (key: string, params?: Record<string, string | number>) => string
): string | null {
  for (const line of lines) {
    if (!line.orderNumber.trim() || !line.lineKey.trim()) continue;
    const qty = Number(line.bookedQuantity);
    const max = line.maxBookedQuantity ? Number(line.maxBookedQuantity) : null;
    if (Number.isNaN(qty) || qty <= 0) continue;
    if (max != null && !Number.isNaN(max) && qty > max) {
      return t("shipperBookingsPage.quantityExceedsMax", {
        lineKey: line.lineKey,
        max,
      });
    }
  }
  return null;
}

export async function enrichLinesWithMaxQuantities(
  lines: ShipperBookingLineFormState[],
  excludeBookingId?: string
): Promise<ShipperBookingLineFormState[]> {
  const orderNumbers = [...new Set(lines.map((line) => line.orderNumber.trim()).filter(Boolean))];
  if (orderNumbers.length === 0) return lines;

  const maxByComposite = new Map<string, number>();

  await Promise.all(
    orderNumbers.map(async (orderNumber) => {
      try {
        const data = await ordersApi.fetchOrderBookableLines(orderNumber, excludeBookingId);
        if (!data.order) return;
        for (const row of data.lines) {
          maxByComposite.set(lineCompositeKey(data.order.orderNumber, row.lineKey), row.remainingQuantity);
        }
      } catch {
        // Best-effort: server still validates on save.
      }
    })
  );

  return lines.map((line) => {
    if (!line.orderNumber.trim() || !line.lineKey.trim()) {
      return { ...line, maxBookedQuantity: "" };
    }
    const max = maxByComposite.get(lineCompositeKey(line.orderNumber, line.lineKey));
    if (max == null) return { ...line, maxBookedQuantity: "" };
    return {
      ...line,
      maxBookedQuantity: String(max),
      bookedQuantity: clampBookedQuantity(line.bookedQuantity, String(max)),
    };
  });
}
