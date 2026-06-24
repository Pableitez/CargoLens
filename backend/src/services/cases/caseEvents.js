import mongoose from "mongoose";
import { CaseEvent } from "../../models/CaseEvent.js";
import { devError } from "../../utils/devLog.js";

export function serializeCaseEvent(doc) {
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

export async function listCaseEvents(caseId, { clientVisibleOnly = false } = {}) {
  const q = { caseId: new mongoose.Types.ObjectId(caseId) };
  if (clientVisibleOnly) q.visibleToClient = true;
  const rows = await CaseEvent.find(q).sort({ occurredAt: -1, createdAt: -1 }).limit(100).lean();
  return rows.map(serializeCaseEvent);
}

export async function logCaseEvent({
  caseId,
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
    const doc = await CaseEvent.create({
      caseId,
      companyId,
      kind,
      message,
      actorUserId,
      actorEmail,
      visibleToClient,
      meta,
      occurredAt,
    });
    return serializeCaseEvent(doc.toObject());
  } catch (err) {
    devError("logCaseEvent", err);
    return null;
  }
}

function shipmentIdStrings(ids = []) {
  return ids.map((id) => String(id)).sort();
}

export async function logCaseChanges({ caseId, companyId, before, after, actorUserId, actorEmail }) {
  const events = [];

  if (before.status !== after.status) {
    events.push(
      await logCaseEvent({
        caseId,
        companyId,
        kind: "status_change",
        message: `Status changed to ${after.status}`,
        actorUserId,
        actorEmail,
        meta: { from: before.status, to: after.status },
      })
    );
  }

  const beforeShipments = shipmentIdStrings(before.shipmentIds);
  const afterShipments = shipmentIdStrings(after.shipmentIds);
  const added = afterShipments.filter((id) => !beforeShipments.includes(id));
  const removed = beforeShipments.filter((id) => !afterShipments.includes(id));

  for (const id of added) {
    events.push(
      await logCaseEvent({
        caseId,
        companyId,
        kind: "shipment_linked",
        message: `Shipment linked (${id})`,
        actorUserId,
        actorEmail,
        meta: { shipmentId: id },
      })
    );
  }

  for (const id of removed) {
    events.push(
      await logCaseEvent({
        caseId,
        companyId,
        kind: "shipment_unlinked",
        message: `Shipment unlinked (${id})`,
        actorUserId,
        actorEmail,
        meta: { shipmentId: id },
      })
    );
  }

  return events.filter(Boolean);
}
