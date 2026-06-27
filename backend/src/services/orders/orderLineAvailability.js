import mongoose from "mongoose";
import { Order } from "../../models/Order.js";
import { ShipperBooking } from "../../models/ShipperBooking.js";
import { serializeOrder } from "./serializeOrder.js";

export function normalizeOrderNumber(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

/** Canonical number for matching — supports legacy Mongo docs that only have poNumber. */
export function resolveOrderNumber(doc) {
  return normalizeOrderNumber(doc?.orderNumber ?? doc?.poNumber ?? "");
}

export function displayOrderNumber(doc) {
  return String(doc?.orderNumber ?? doc?.poNumber ?? "").trim();
}

export async function findOrderByNumber(companyObjectId, orderNumberKey) {
  if (!orderNumberKey) return null;

  const byExact = await Order.findOne({
    companyId: companyObjectId,
    $or: [{ orderNumber: orderNumberKey }, { poNumber: orderNumberKey }],
  }).lean();
  if (byExact && resolveOrderNumber(byExact) === orderNumberKey) return byExact;

  const rows = await Order.find({ companyId: companyObjectId }).lean();
  return rows.find((row) => resolveOrderNumber(row) === orderNumberKey) ?? null;
}

export async function aggregateBookedQuantities(companyObjectId, orderNumberKey, { excludeBookingId } = {}) {
  const excludeId = excludeBookingId ? new mongoose.Types.ObjectId(String(excludeBookingId)) : null;

  const bookings = await ShipperBooking.find({
    companyId: companyObjectId,
    status: { $ne: "cancelled" },
    "lines.orderNumber": { $nin: ["", null] },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  const byLineKey = new Map();

  for (const booking of bookings) {
    for (const line of booking.lines ?? []) {
      if (normalizeOrderNumber(line.orderNumber) !== orderNumberKey) continue;
      const lineKey = String(line.lineKey ?? "").trim();
      if (!lineKey) continue;
      const prev = byLineKey.get(lineKey) ?? 0;
      byLineKey.set(lineKey, prev + Number(line.bookedQuantity ?? 0));
    }
  }

  return byLineKey;
}

export async function getOrderBookableLines(companyId, orderNumber, { excludeBookingId } = {}) {
  const orderNumberKey = normalizeOrderNumber(orderNumber);
  if (!orderNumberKey) {
    return { order: null, lines: [], errors: ["orderNumber is required"] };
  }

  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  const order = await findOrderByNumber(companyObjectId, orderNumberKey);
  if (!order) {
    return { order: null, lines: [], errors: ["Order not found"] };
  }

  if (order.status === "cancelled") {
    return { order: null, lines: [], errors: ["Cancelled orders cannot be booked"] };
  }

  const bookedByLineKey = await aggregateBookedQuantities(companyObjectId, orderNumberKey, {
    excludeBookingId,
  });

  const lines = (order.lines ?? []).map((line) => {
    const lineKey = String(line.lineKey ?? "").trim();
    const orderedQuantity = Number(line.quantity ?? 0);
    const bookedQuantity = bookedByLineKey.get(lineKey) ?? 0;
    const remainingQuantity = Math.max(0, orderedQuantity - bookedQuantity);
    const fullyBooked = remainingQuantity <= 0;

    return {
      lineKey,
      sku: line.sku ?? "",
      description: line.description ?? "",
      orderedQuantity,
      uom: line.uom ?? "",
      countryOfOrigin: line.countryOfOrigin ?? "",
      totalGrossWeight: line.totalGrossWeight ?? null,
      totalCbm: line.totalCbm ?? null,
      bookedQuantity,
      remainingQuantity,
      fullyBooked,
      bookable: !fullyBooked && orderedQuantity > 0,
    };
  });

  const header = serializeOrder(order);

  return {
    order: {
      id: String(header.id),
      orderNumber: header.orderNumber,
      externalBusinessId: header.externalBusinessId,
      customer: header.customer,
      shipper: header.shipper,
      consignee: header.consignee,
      clientId: header.clientId,
      supplyChainId: header.supplyChainId,
      operatingShipperPartyId: header.operatingShipperPartyId,
      operatingConsigneePartyId: header.operatingConsigneePartyId,
      status: header.status,
      transportMode: header.transportMode,
      placeOfReceipt: header.placeOfReceipt,
      portOfLoading: header.portOfLoading,
      portOfDischarge: header.portOfDischarge,
      placeOfDelivery: header.placeOfDelivery,
      incoterm: header.incoterm,
      shippingWindowStart: header.shippingWindowStart,
      shippingWindowEnd: header.shippingWindowEnd,
      notes: header.notes,
    },
    lines,
    errors: [],
  };
}

export async function validateBookingLinesAgainstOrders(companyId, lines, { excludeBookingId } = {}) {
  const errors = [];
  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  const orderCache = new Map();
  const bookedCache = new Map();
  const pendingByOrderLine = new Map();

  for (let index = 0; index < (lines ?? []).length; index += 1) {
    const line = lines[index];
    const orderNumberKey = normalizeOrderNumber(line?.orderNumber);
    if (!orderNumberKey) continue;

    const lineKey = String(line?.lineKey ?? "").trim();
    const bookedQuantity = Number(line?.bookedQuantity ?? 0);
    const prefix = `lines[${index}]`;

    if (!lineKey) {
      errors.push(`${prefix}: lineKey is required when orderNumber is set`);
      continue;
    }

    const compositeKey = `${orderNumberKey}|${lineKey}`;
    if (pendingByOrderLine.has(compositeKey)) {
      errors.push(`${prefix}: duplicate booking for order line ${lineKey}`);
      continue;
    }
    pendingByOrderLine.set(compositeKey, bookedQuantity);

    if (!orderCache.has(orderNumberKey)) {
      const order = await findOrderByNumber(companyObjectId, orderNumberKey);
      orderCache.set(orderNumberKey, order);
      if (order) {
        bookedCache.set(
          orderNumberKey,
          await aggregateBookedQuantities(companyObjectId, orderNumberKey, { excludeBookingId })
        );
      }
    }

    const order = orderCache.get(orderNumberKey);
    if (!order) {
      errors.push(`${prefix}: order ${line.orderNumber} not found`);
      continue;
    }

    if (order.status === "cancelled") {
      errors.push(`${prefix}: order ${line.orderNumber} is cancelled`);
      continue;
    }

    const orderLine = (order.lines ?? []).find((row) => String(row.lineKey).trim() === lineKey);
    if (!orderLine) {
      errors.push(`${prefix}: line ${lineKey} not found on order ${line.orderNumber}`);
      continue;
    }

    const orderedQuantity = Number(orderLine.quantity ?? 0);
    const alreadyBooked = bookedCache.get(orderNumberKey)?.get(lineKey) ?? 0;
    const remaining = Math.max(0, orderedQuantity - alreadyBooked);

    if (remaining <= 0) {
      errors.push(`${prefix}: line ${lineKey} is already fully booked on order ${line.orderNumber}`);
      continue;
    }

    if (bookedQuantity > remaining) {
      errors.push(
        `${prefix}: booked quantity ${bookedQuantity} exceeds remaining ${remaining} for line ${lineKey}`
      );
    }
  }

  return errors;
}
