import mongoose from "mongoose";
import { Order } from "../../models/Order.js";
import { findOrderByNumber, normalizeOrderNumber } from "../orders/orderLineAvailability.js";
import { getTradeAccess, portalClientObjectId } from "../tradeMasters/tradeScope.js";

/** Restrict list queries to the portal client's contractual party when applicable. */
export function applyContractualPartyListFilter(q, req) {
  const { isClientPortal, portalClientId } = getTradeAccess(req);
  if (!isClientPortal) return q;
  return {
    ...q,
    contractualPartyId: portalClientObjectId(portalClientId),
  };
}

export function canAccessContractualPartyResource(doc, portalClientId) {
  if (!portalClientId) return true;
  if (!doc?.contractualPartyId) return false;
  return String(doc.contractualPartyId) === portalClientId;
}

export async function orderNumbersForPortalClient(companyId, portalClientId) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const clientOid = portalClientObjectId(portalClientId);
  const orders = await Order.find({
    companyId: companyOid,
    contractualPartyId: clientOid,
  })
    .select("orderNumber poNumber")
    .lean();

  const values = new Set();
  for (const row of orders) {
    const normalized = normalizeOrderNumber(row);
    if (normalized) values.add(normalized);
    for (const raw of [row.orderNumber, row.poNumber]) {
      const trimmed = String(raw ?? "").trim();
      if (trimmed) values.add(trimmed);
    }
  }
  return [...values];
}

/** Resolve contractual party from linked order lines (first match wins). */
export async function resolveBookingContractualPartyId(companyId, lines) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  for (const line of lines ?? []) {
    const order = await findOrderByNumber(companyOid, normalizeOrderNumber(line.orderNumber));
    if (order?.contractualPartyId) return order.contractualPartyId;
  }
  return null;
}

/** Restrict shipper booking list queries for portal users. */
export async function applyShipperBookingListFilter(q, req) {
  const { isClientPortal, portalClientId } = getTradeAccess(req);
  if (!isClientPortal) return q;

  const clientOid = portalClientObjectId(portalClientId);
  const orderNumbers = await orderNumbersForPortalClient(req.user.companyId, portalClientId);
  const or = [];

  if (clientOid) {
    or.push({ contractualPartyId: clientOid });
  }
  if (orderNumbers.length > 0) {
    or.push({ "lines.orderNumber": { $in: orderNumbers } });
  }

  if (or.length === 0) {
    return { ...q, _id: { $in: [] } };
  }
  return { ...q, $or: or };
}

export async function canAccessShipperBooking(booking, companyId, portalClientId) {
  if (!portalClientId) return true;
  if (booking?.contractualPartyId && String(booking.contractualPartyId) === portalClientId) {
    return true;
  }

  const companyOid = new mongoose.Types.ObjectId(companyId);
  for (const line of booking?.lines ?? []) {
    const order = await findOrderByNumber(companyOid, normalizeOrderNumber(line.orderNumber));
    if (order && String(order.contractualPartyId) === portalClientId) return true;
  }
  return false;
}
