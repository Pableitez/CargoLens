import mongoose from "mongoose";
import { Order } from "../../models/Order.js";
import { logOrderEvent } from "../orders/orderEvents.js";
import {
  aggregateBookedQuantities,
  findOrderByNumber,
  normalizeOrderNumber,
} from "./orderLineAvailability.js";

import { BOOKING_DERIVED_ORDER_STATUSES, MANUAL_ORDER_STATUSES } from "../../../../shared/domain/orders.js";

export { BOOKING_DERIVED_ORDER_STATUSES as BOOKING_DERIVED_STATUSES, MANUAL_ORDER_STATUSES };

function collectOrderNumbersFromLines(lines = []) {
  const numbers = new Set();
  for (const line of lines) {
    const key = normalizeOrderNumber(line?.orderNumber);
    if (key) numbers.add(key);
  }
  return numbers;
}

export function computeOrderStatusFromBookings(order, bookedByLineKey) {
  if (order.status === "cancelled") return "cancelled";

  const lines = order.lines ?? [];
  if (lines.length === 0) {
    return order.status === "draft" ? "draft" : "new";
  }

  let anyBooked = false;
  let allFullyBooked = true;

  for (const line of lines) {
    const lineKey = String(line.lineKey ?? "").trim();
    const orderedQty = Number(line.quantity ?? 0);
    const bookedQty = bookedByLineKey.get(lineKey) ?? 0;

    if (bookedQty > 0) anyBooked = true;
    if (bookedQty < orderedQty) allFullyBooked = false;
  }

  if (!anyBooked) {
    return order.status === "draft" ? "draft" : "new";
  }
  if (allFullyBooked) return "booked";
  return "partially_booked";
}

export async function syncOrderStatusFromBookings(companyId, orderNumber, actor = null) {
  const orderNumberKey = normalizeOrderNumber(orderNumber);
  if (!orderNumberKey) return null;

  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  const orderRow = await findOrderByNumber(companyObjectId, orderNumberKey);
  if (!orderRow) return null;

  const orderDoc = await Order.findById(orderRow._id);
  if (!orderDoc || orderDoc.status === "cancelled") return orderDoc;

  const bookedByLineKey = await aggregateBookedQuantities(companyObjectId, orderNumberKey);
  const nextStatus = computeOrderStatusFromBookings(orderDoc.toObject(), bookedByLineKey);

  if (orderDoc.status === nextStatus) return orderDoc;

  const previousStatus = orderDoc.status;
  orderDoc.status = nextStatus;
  await orderDoc.save();

  await logOrderEvent({
    orderId: orderDoc._id,
    companyId,
    kind: "status_change",
    message: `Status changed to ${nextStatus} (from shipper booking)`,
    actorUserId: actor?.userId ?? null,
    actorEmail: actor?.email ?? "",
    meta: { from: previousStatus, to: nextStatus, source: "shipper_booking" },
  });

  return orderDoc;
}

export async function syncOrdersForBooking(companyId, booking, previousLines = [], actor = null) {
  const orderNumbers = new Set([
    ...collectOrderNumbersFromLines(booking?.lines),
    ...collectOrderNumbersFromLines(previousLines),
  ]);

  const results = [];
  for (const orderNumberKey of orderNumbers) {
    const updated = await syncOrderStatusFromBookings(companyId, orderNumberKey, actor);
    if (updated) results.push(updated);
  }
  return results;
}

export async function syncOrdersForImport(companyId, groupedBookings, actor = null) {
  const orderNumbers = new Set();
  for (const [, group] of groupedBookings) {
    for (const line of group.lines.values()) {
      const key = normalizeOrderNumber(line.orderNumber);
      if (key) orderNumbers.add(key);
    }
  }

  const results = [];
  for (const orderNumberKey of orderNumbers) {
    const updated = await syncOrderStatusFromBookings(companyId, orderNumberKey, actor);
    if (updated) results.push(updated);
  }
  return results;
}

export function isBookingDerivedOrderStatus(status) {
  return BOOKING_DERIVED_ORDER_STATUSES.includes(String(status ?? "").trim());
}
