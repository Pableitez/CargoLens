import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Case } from "../models/Case.js";
import { CaseEvent } from "../models/CaseEvent.js";
import { Client } from "../models/Client.js";
import { Shipment } from "../models/Shipment.js";
import { logCaseChanges, logCaseEvent, listCaseEvents } from "../services/cases/caseEvents.js";
import { serializeCase } from "../services/cases/serializeCase.js";
import { validateCaseInput } from "../services/cases/caseValidation.js";
import { logWorkspaceActivity } from "../services/workspaceActivityLog.js";
import { devError } from "../utils/devLog.js";

function dbUnavailable(res) {
  return res.status(503).json({
    error: "DB_UNAVAILABLE",
    message: "Database not configured or unreachable.",
  });
}

function companyObjectId(companyId) {
  return new mongoose.Types.ObjectId(companyId);
}

async function assertClientBelongsToCompany(clientId, companyId) {
  if (!clientId) return true;
  if (!mongoose.isValidObjectId(clientId)) return false;
  const client = await Client.findOne({
    _id: clientId,
    companyId: companyObjectId(companyId),
  }).lean();
  return Boolean(client);
}

async function resolveShipmentIds(shipmentIds, companyId) {
  if (!shipmentIds?.length) return { ok: true, ids: [] };
  const unique = [...new Set(shipmentIds.map(String))];
  for (const id of unique) {
    if (!mongoose.isValidObjectId(id)) {
      return { ok: false, message: `Invalid shipment id: ${id}` };
    }
  }
  const count = await Shipment.countDocuments({
    _id: { $in: unique },
    companyId: companyObjectId(companyId),
  });
  if (count !== unique.length) {
    return { ok: false, message: "One or more shipments were not found for this company." };
  }
  return { ok: true, ids: unique.map((id) => new mongoose.Types.ObjectId(id)) };
}

export async function listCases(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const companyId = req.user.companyId;
  const q = { companyId: companyObjectId(companyId) };

  if (req.user.clientId) {
    q.clientId = companyObjectId(req.user.clientId);
  }

  const status = String(req.query.status ?? "").trim();
  if (status) q.status = status;

  try {
    const rows = await Case.find(q).sort({ updatedAt: -1 }).lean();
    return res.json({ items: rows.map((row) => serializeCase(row)) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list cases." });
  }
}

export async function getCase(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid case id." });
  }

  const q = {
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  };
  if (req.user.clientId) {
    q.clientId = companyObjectId(req.user.clientId);
  }

  try {
    const row = await Case.findOne(q).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Case not found." });
    }
    const events = await listCaseEvents(row._id, { clientVisibleOnly: Boolean(req.user.clientId) });
    return res.json({ item: serializeCase(row), events });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load case." });
  }
}

export async function createCase(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { errors, data } = validateCaseInput(req.body ?? {});
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  if (data.clientId && !(await assertClientBelongsToCompany(data.clientId, req.user.companyId))) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Client not found for this company." });
  }

  if (data.shipmentIds) {
    const resolved = await resolveShipmentIds(data.shipmentIds, req.user.companyId);
    if (!resolved.ok) {
      return res.status(400).json({ error: "INVALID_INPUT", message: resolved.message });
    }
    data.shipmentIds = resolved.ids;
  }

  try {
    const doc = await Case.create({
      companyId: req.user.companyId,
      reference: data.reference,
      title: data.title ?? "",
      status: data.status ?? "draft",
      tradeDirection: data.tradeDirection ?? "",
      incoterm: data.incoterm ?? "",
      origin: data.origin ?? "",
      destination: data.destination ?? "",
      clientId: data.clientId ?? null,
      shipmentIds: data.shipmentIds ?? [],
      openedAt: data.openedAt ?? new Date(),
      closedAt: data.closedAt ?? null,
      notes: data.notes ?? "",
    });

    await logCaseEvent({
      caseId: doc._id,
      companyId: req.user.companyId,
      kind: "created",
      message: `Case created (${doc.reference})`,
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
    });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "case.create",
      summary: `Case created: ${doc.reference}`,
      meta: { reference: doc.reference, caseId: String(doc._id) },
    });

    return res.status(201).json({ item: serializeCase(doc.toObject()) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE_REFERENCE",
        message: "A case with this reference already exists.",
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create case." });
  }
}

export async function updateCase(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid case id." });
  }

  const { errors, data } = validateCaseInput(req.body ?? {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  if (data.clientId && !(await assertClientBelongsToCompany(data.clientId, req.user.companyId))) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Client not found for this company." });
  }

  if (data.shipmentIds) {
    const resolved = await resolveShipmentIds(data.shipmentIds, req.user.companyId);
    if (!resolved.ok) {
      return res.status(400).json({ error: "INVALID_INPUT", message: resolved.message });
    }
    data.shipmentIds = resolved.ids;
  }

  try {
    const caseDoc = await Case.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!caseDoc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Case not found." });
    }

    const before = caseDoc.toObject();

    for (const [key, value] of Object.entries(data)) {
      caseDoc[key] = value;
    }
    await caseDoc.save();

    await logCaseChanges({
      caseId: caseDoc._id,
      companyId: req.user.companyId,
      before,
      after: caseDoc.toObject(),
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
    });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "case.update",
      summary: `Case updated: ${caseDoc.reference}`,
      meta: { reference: caseDoc.reference, caseId: String(caseDoc._id) },
    });

    return res.json({ item: serializeCase(caseDoc.toObject()) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE_REFERENCE",
        message: "A case with this reference already exists.",
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update case." });
  }
}

export async function deleteCase(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid case id." });
  }

  try {
    const caseDoc = await Case.findOneAndDelete({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!caseDoc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Case not found." });
    }

    await CaseEvent.deleteMany({ caseId: caseDoc._id });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "case.delete",
      summary: `Case deleted: ${caseDoc.reference}`,
      meta: { reference: caseDoc.reference },
    });

    return res.json({ ok: true });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete case." });
  }
}

export async function listCaseEventsHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid case id." });
  }

  const caseDoc = await Case.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!caseDoc) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Case not found." });
  }

  const events = await listCaseEvents(id, { clientVisibleOnly: Boolean(req.user.clientId) });
  return res.json({ items: events });
}

export async function createCaseEventHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid case id." });
  }

  const kind = String(req.body?.kind ?? "note").trim();
  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Message is required." });
  }
  if (kind !== "note" && kind !== "milestone") {
    return res.status(400).json({ error: "INVALID_INPUT", message: "kind must be note or milestone." });
  }

  const caseDoc = await Case.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!caseDoc) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Case not found." });
  }

  const event = await logCaseEvent({
    caseId: caseDoc._id,
    companyId: req.user.companyId,
    kind,
    message,
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    visibleToClient: req.body?.visibleToClient !== false,
  });

  return res.status(201).json({ item: event });
}
