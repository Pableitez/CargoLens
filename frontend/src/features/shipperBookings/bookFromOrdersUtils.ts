import * as ordersApi from "../../api/orders";
import type { OrderBookableSummary } from "../orders/types";
import { bookableLineToFormState, prefillBookingFormFromOrders } from "./prefillBookingFromOrder";
import { lineCompositeKey } from "./shipperBookingLineUtils";
import type { ShipperBookingLineFormState } from "./types";

export { bookableLineToFormState, prefillBookingFormFromOrders };

export type LoadBookableOrdersResult = {
  lines: ShipperBookingLineFormState[];
  orderSummaries: OrderBookableSummary[];
  firstOrder: OrderBookableSummary | null;
  emptyOrders: string[];
  failedOrders: { orderNumber: string; message: string }[];
};

function apiErrorMessage(err: unknown): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message?.trim() || "Order not found";
}

export async function loadBookableLinesFromOrders(orderNumbers: string[]): Promise<LoadBookableOrdersResult> {
  const lines: ShipperBookingLineFormState[] = [];
  const seen = new Set<string>();
  const orderSummaries: OrderBookableSummary[] = [];
  const emptyOrders: string[] = [];
  const failedOrders: { orderNumber: string; message: string }[] = [];

  for (const raw of orderNumbers) {
    const orderNumber = raw.trim();
    if (!orderNumber) continue;

    try {
      const data = await ordersApi.fetchOrderBookableLines(orderNumber);
      if (!data.order) {
        failedOrders.push({
          orderNumber,
          message: data.errors?.join(" ") || "Order not found",
        });
        continue;
      }

      orderSummaries.push(data.order);

      const bookable = data.lines.filter((row) => row.bookable);
      if (bookable.length === 0) {
        emptyOrders.push(orderNumber);
        continue;
      }

      for (const row of bookable) {
        const composite = lineCompositeKey(data.order.orderNumber, row.lineKey);
        if (seen.has(composite)) continue;
        seen.add(composite);
        lines.push(bookableLineToFormState(data.order.orderNumber, row, data.order.externalBusinessId));
      }
    } catch (err) {
      failedOrders.push({
        orderNumber,
        message: apiErrorMessage(err),
      });
    }
  }

  return {
    lines,
    orderSummaries,
    firstOrder: orderSummaries[0] ?? null,
    emptyOrders,
    failedOrders,
  };
}

export type BookFromOrdersLocationState = {
  fromOrderNumbers: string[];
};
