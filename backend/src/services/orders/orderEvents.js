import mongoose from "mongoose";
import { OrderEvent } from "../../models/OrderEvent.js";
import { devError } from "../../utils/devLog.js";

export function serializeOrderEvent(doc) {
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

export async function listOrderEvents(orderId, { clientVisibleOnly = false } = {}) {
  const q = { orderId: new mongoose.Types.ObjectId(orderId) };
  if (clientVisibleOnly) q.visibleToClient = true;
  const rows = await OrderEvent.find(q).sort({ occurredAt: -1, createdAt: -1 }).limit(100).lean();
  return rows.map(serializeOrderEvent);
}

export async function logOrderEvent({
  orderId,
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
    const doc = await OrderEvent.create({
      orderId,
      companyId,
      kind,
      message,
      actorUserId,
      actorEmail,
      visibleToClient,
      meta,
      occurredAt,
    });
    return serializeOrderEvent(doc.toObject());
  } catch (err) {
    devError("logOrderEvent", err);
    return null;
  }
}

export async function logOrderChanges({ orderId, companyId, before, after, actorUserId, actorEmail }) {
  const events = [];

  if (before.status !== after.status) {
    events.push(
      await logOrderEvent({
        orderId,
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
