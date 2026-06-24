import mongoose from "mongoose";
import { ShipmentEvent } from "../../models/ShipmentEvent.js";
import { devError } from "../../utils/devLog.js";

export function serializeShipmentEvent(doc) {
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

export async function listShipmentEvents(shipmentId, { clientVisibleOnly = false } = {}) {
  const q = { shipmentId: new mongoose.Types.ObjectId(shipmentId) };
  if (clientVisibleOnly) q.visibleToClient = true;
  const rows = await ShipmentEvent.find(q).sort({ occurredAt: -1, createdAt: -1 }).limit(100).lean();
  return rows.map(serializeShipmentEvent);
}

export async function logShipmentEvent({
  shipmentId,
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
    const doc = await ShipmentEvent.create({
      shipmentId,
      companyId,
      kind,
      message,
      actorUserId,
      actorEmail,
      visibleToClient,
      meta,
      occurredAt,
    });
    return serializeShipmentEvent(doc.toObject());
  } catch (err) {
    devError("logShipmentEvent", err);
    return null;
  }
}

export async function logShipmentChanges({ shipmentId, companyId, before, after, actorUserId, actorEmail }) {
  const events = [];

  if (before.status !== after.status) {
    events.push(
      await logShipmentEvent({
        shipmentId,
        companyId,
        kind: "status_change",
        message: `Status changed to ${after.status}`,
        actorUserId,
        actorEmail,
        meta: { from: before.status, to: after.status },
      })
    );
  }

  const beforeEta = before.eta ? new Date(before.eta).toISOString() : null;
  const afterEta = after.eta ? new Date(after.eta).toISOString() : null;
  if (beforeEta !== afterEta) {
    events.push(
      await logShipmentEvent({
        shipmentId,
        companyId,
        kind: "eta_change",
        message: afterEta ? `ETA updated to ${afterEta.slice(0, 10)}` : "ETA cleared",
        actorUserId,
        actorEmail,
        meta: { from: beforeEta, to: afterEta },
      })
    );
  }

  return events.filter(Boolean);
}
