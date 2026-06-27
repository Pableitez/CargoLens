import mongoose from "mongoose";
import { ShipperBookingEvent } from "../../models/ShipperBookingEvent.js";
import { devError } from "../../utils/devLog.js";

export function serializeShipperBookingEvent(doc) {
  return {
    id: doc._id,
    kind: doc.kind,
    message: doc.message,
    actorEmail: doc.actorEmail || "",
    visibleToClient: doc.visibleToClient !== false,
    meta: doc.meta ?? null,
    occurredAt: doc.occurredAt ?? doc.createdAt,
    createdAt: doc.createdAt,
  };
}

export async function listShipperBookingEvents(shipperBookingId, { clientVisibleOnly = false } = {}) {
  const q = { shipperBookingId: new mongoose.Types.ObjectId(shipperBookingId) };
  if (clientVisibleOnly) q.visibleToClient = true;
  const rows = await ShipperBookingEvent.find(q).sort({ occurredAt: -1, createdAt: -1 }).limit(100).lean();
  return rows.map(serializeShipperBookingEvent);
}

export async function logShipperBookingEvent({
  shipperBookingId,
  companyId,
  kind,
  message,
  actorUserId = null,
  actorEmail = "",
  visibleToClient = true,
  meta = null,
  occurredAt = new Date(),
}) {
  try {
    const doc = await ShipperBookingEvent.create({
      shipperBookingId,
      companyId,
      kind,
      message,
      actorUserId,
      actorEmail,
      visibleToClient,
      meta,
      occurredAt,
    });
    return serializeShipperBookingEvent(doc.toObject());
  } catch (err) {
    devError("logShipperBookingEvent", err);
    return null;
  }
}

export async function logShipperBookingChanges({
  shipperBookingId,
  companyId,
  before,
  after,
  actorUserId,
  actorEmail,
}) {
  const events = [];

  if (before.status !== after.status) {
    events.push(
      await logShipperBookingEvent({
        shipperBookingId,
        companyId,
        kind: "status_change",
        message: `Status changed to ${after.status}`,
        actorUserId,
        actorEmail,
        meta: { from: before.status, to: after.status },
      })
    );
  }

  return events.filter(Boolean);
}
