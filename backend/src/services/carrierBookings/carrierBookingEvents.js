import mongoose from "mongoose";
import { CarrierBookingEvent } from "../../models/CarrierBookingEvent.js";
import { devError } from "../../utils/devLog.js";

export function serializeCarrierBookingEvent(doc) {
  return {
    id: doc._id,
    kind: doc.kind,
    message: doc.message,
    actorEmail: doc.actorEmail || "",
    visibleToClient: doc.visibleToClient === true,
    meta: doc.meta ?? null,
    occurredAt: doc.occurredAt ?? doc.createdAt,
    createdAt: doc.createdAt,
  };
}

export async function listCarrierBookingEvents(carrierBookingRequestId) {
  const q = {
    carrierBookingRequestId: new mongoose.Types.ObjectId(carrierBookingRequestId),
  };
  const rows = await CarrierBookingEvent.find(q).sort({ occurredAt: -1, createdAt: -1 }).limit(100).lean();
  return rows.map(serializeCarrierBookingEvent);
}

export async function logCarrierBookingEvent({
  carrierBookingRequestId,
  companyId,
  kind,
  message,
  actorUserId = null,
  actorEmail = "",
  visibleToClient = false,
  meta = null,
  occurredAt = new Date(),
}) {
  try {
    const doc = await CarrierBookingEvent.create({
      carrierBookingRequestId,
      companyId,
      kind,
      message,
      actorUserId,
      actorEmail,
      visibleToClient,
      meta,
      occurredAt,
    });
    return serializeCarrierBookingEvent(doc.toObject());
  } catch (err) {
    devError("logCarrierBookingEvent", err);
    return null;
  }
}

export async function logCarrierBookingStatusChange({
  carrierBookingRequestId,
  companyId,
  before,
  after,
  actorUserId,
  actorEmail,
  meta = null,
}) {
  if (before.status === after.status) return null;
  return logCarrierBookingEvent({
    carrierBookingRequestId,
    companyId,
    kind: "status_change",
    message: `Status changed to ${after.status}`,
    actorUserId,
    actorEmail,
    meta: { from: before.status, to: after.status, ...(meta ?? {}) },
  });
}
