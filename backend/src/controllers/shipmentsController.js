import mongoose from "mongoose";
import { getEnv } from "../config/env.js";
import { isDbConnected } from "../db.js";
import { Client } from "../models/Client.js";
import { Shipment } from "../models/Shipment.js";
import { ShipmentShareLink } from "../models/ShipmentShareLink.js";
import {
  logShipmentChanges,
  logShipmentEvent,
  listShipmentEvents,
} from "../services/shipments/shipmentEvents.js";
import {
  buildClientInviteMap,
  importShipmentRows,
  previewShipmentImportRows,
} from "../services/shipments/shipmentImport.js";
import {
  serializePublicShipment,
  serializeShareLink,
  serializeShipment,
} from "../services/shipments/serializeShipment.js";
import { generateShareToken, hashShareToken } from "../services/shipments/shareToken.js";
import { validateShipmentInput } from "../services/shipments/shipmentValidation.js";
import { logWorkspaceActivity } from "../services/workspaceActivityLog.js";
import { devError } from "../utils/devLog.js";
import { readWorkbookRows } from "../utils/spreadsheet.js";

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

function buildPublicShareUrl(token) {
  const origin = String(getEnv().clientOrigin ?? "")
    .trim()
    .replace(/\/$/, "");
  if (origin) return `${origin}/share/${token}`;
  return `/share/${token}`;
}

export async function listShipments(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const companyId = req.user.companyId;
  const q = { companyId: companyObjectId(companyId) };

  if (req.user.clientId) {
    q.clientId = companyObjectId(req.user.clientId);
  }

  const status = String(req.query.status ?? "").trim();
  if (status) q.status = status;

  try {
    const rows = await Shipment.find(q).sort({ updatedAt: -1 }).lean();
    return res.json({ items: rows.map((row) => serializeShipment(row)) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list shipments." });
  }
}

export async function getShipment(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipment id." });
  }

  const q = {
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  };
  if (req.user.clientId) {
    q.clientId = companyObjectId(req.user.clientId);
  }

  try {
    const row = await Shipment.findOne(q).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Shipment not found." });
    }
    const events = await listShipmentEvents(row._id);
    return res.json({ item: serializeShipment(row), events });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load shipment." });
  }
}

export async function createShipment(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { errors, data } = validateShipmentInput(req.body ?? {});
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  if (data.clientId && !(await assertClientBelongsToCompany(data.clientId, req.user.companyId))) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Client not found for this company." });
  }

  try {
    const doc = await Shipment.create({
      companyId: req.user.companyId,
      reference: data.reference,
      origin: data.origin ?? "",
      destination: data.destination ?? "",
      etd: data.etd ?? null,
      eta: data.eta ?? null,
      status: data.status ?? "draft",
      notes: data.notes ?? "",
      clientId: data.clientId ?? null,
      containers: data.containers ?? [],
    });

    await logShipmentEvent({
      shipmentId: doc._id,
      companyId: req.user.companyId,
      kind: "created",
      message: `Shipment created (${doc.reference})`,
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
    });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "shipment.create",
      summary: `Shipment created: ${doc.reference}`,
      meta: { reference: doc.reference, shipmentId: String(doc._id) },
    });

    return res.status(201).json({ item: serializeShipment(doc.toObject()) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE_REFERENCE",
        message: "A shipment with this reference already exists.",
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create shipment." });
  }
}

export async function updateShipment(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipment id." });
  }

  const { errors, data } = validateShipmentInput(req.body ?? {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  if (data.clientId && !(await assertClientBelongsToCompany(data.clientId, req.user.companyId))) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Client not found for this company." });
  }

  try {
    const shipment = await Shipment.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!shipment) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Shipment not found." });
    }

    const before = shipment.toObject();

    for (const [key, value] of Object.entries(data)) {
      shipment[key] = value;
    }
    await shipment.save();

    await logShipmentChanges({
      shipmentId: shipment._id,
      companyId: req.user.companyId,
      before,
      after: shipment.toObject(),
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
    });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "shipment.update",
      summary: `Shipment updated: ${shipment.reference}`,
      meta: { reference: shipment.reference, shipmentId: String(shipment._id) },
    });

    return res.json({ item: serializeShipment(shipment.toObject()) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE_REFERENCE",
        message: "A shipment with this reference already exists.",
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update shipment." });
  }
}

export async function deleteShipment(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipment id." });
  }

  try {
    const shipment = await Shipment.findOneAndDelete({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!shipment) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Shipment not found." });
    }

    await ShipmentShareLink.deleteMany({ shipmentId: shipment._id });
    const { ShipmentEvent } = await import("../models/ShipmentEvent.js");
    await ShipmentEvent.deleteMany({ shipmentId: shipment._id });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "shipment.delete",
      summary: `Shipment deleted: ${shipment.reference}`,
      meta: { reference: shipment.reference },
    });

    return res.json({ ok: true });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete shipment." });
  }
}

export async function createShareLink(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipment id." });
  }

  const shipment = await Shipment.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!shipment) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Shipment not found." });
  }

  const expiresInDays = Number(req.body?.expiresInDays ?? 30);
  const expiresAt =
    Number.isFinite(expiresInDays) && expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

  try {
    const token = generateShareToken();
    const doc = await ShipmentShareLink.create({
      shipmentId: shipment._id,
      companyId: shipment.companyId,
      tokenHash: hashShareToken(token),
      expiresAt,
      createdBy: req.user.userId,
    });

    const publicUrl = buildPublicShareUrl(token);

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "shipment.share.create",
      summary: `Share link created for ${shipment.reference}`,
      meta: { shipmentId: String(shipment._id), reference: shipment.reference },
    });

    return res.status(201).json({
      item: serializeShareLink(doc.toObject(), publicUrl),
      token,
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create share link." });
  }
}

export async function revokeShareLink(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id, linkId } = req.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(linkId)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid id." });
  }

  try {
    const link = await ShipmentShareLink.findOne({
      _id: linkId,
      shipmentId: id,
      companyId: companyObjectId(req.user.companyId),
      revokedAt: null,
    });
    if (!link) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Share link not found." });
    }

    link.revokedAt = new Date();
    await link.save();

    return res.json({ ok: true });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not revoke share link." });
  }
}

export async function getPublicShipment(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const token = String(req.params.token ?? "").trim();
  if (!token) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Missing share token." });
  }

  try {
    const link = await ShipmentShareLink.findOne({ tokenHash: hashShareToken(token) }).lean();
    if (!link || link.revokedAt) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Share link not found or revoked." });
    }
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ error: "EXPIRED", message: "Share link has expired." });
    }

    const shipment = await Shipment.findOne({
      _id: link.shipmentId,
      companyId: link.companyId,
    }).lean();
    if (!shipment) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Shipment not found." });
    }

    const { Company } = await import("../models/Company.js");
    const company = await Company.findById(link.companyId).lean();
    const events = await listShipmentEvents(shipment._id, { clientVisibleOnly: true });

    return res.json({
      item: serializePublicShipment(shipment, company?.name ?? "", events),
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load shared shipment." });
  }
}

function readImportFile(req, res) {
  if (!req.file?.buffer) {
    res.status(400).json({
      error: "INVALID_INPUT",
      message: "Upload an Excel file (.xlsx or .xls).",
    });
    return null;
  }
  try {
    return readWorkbookRows(req.file.buffer);
  } catch {
    res.status(400).json({ error: "INVALID_FILE", message: "Could not read Excel file." });
    return null;
  }
}

export async function previewImportShipments(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;
  const { sheetName, rows } = parsed;

  if (!rows.length) {
    return res.status(400).json({ error: "EMPTY", message: "The sheet has no data rows." });
  }

  const result = previewShipmentImportRows(rows);
  return res.json({ ok: true, sheet: sheetName, ...result });
}

export async function importShipments(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;
  const { sheetName, rows } = parsed;

  if (!rows.length) {
    return res.status(400).json({ error: "EMPTY", message: "The sheet has no data rows." });
  }

  const companyId = req.user.companyId;
  const inviteToClient = await buildClientInviteMap(companyId);
  const { created, skipped, errors } = await importShipmentRows(rows, companyId, inviteToClient, req.user);

  void logWorkspaceActivity({
    companyId,
    userId: req.user.userId,
    actorEmail: req.user.email,
    action: "shipment.import",
    summary: `Shipment import · ${created} added, ${skipped} skipped (${sheetName})`,
    meta: { created, skipped, sheet: sheetName, rowsTotal: rows.length },
  });

  return res.json({
    ok: true,
    sheet: sheetName,
    rowsTotal: rows.length,
    created,
    skipped,
    errors,
  });
}

export async function listShipmentEventsHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipment id." });
  }

  const shipment = await Shipment.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!shipment) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Shipment not found." });
  }

  const events = await listShipmentEvents(id);
  return res.json({ items: events });
}

export async function createShipmentEventHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipment id." });
  }

  const kind = String(req.body?.kind ?? "note").trim();
  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Message is required." });
  }
  if (kind !== "note" && kind !== "milestone") {
    return res.status(400).json({ error: "INVALID_INPUT", message: "kind must be note or milestone." });
  }

  const shipment = await Shipment.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!shipment) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Shipment not found." });
  }

  const event = await logShipmentEvent({
    shipmentId: shipment._id,
    companyId: req.user.companyId,
    kind,
    message,
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    visibleToClient: req.body?.visibleToClient !== false,
  });

  return res.status(201).json({ item: event });
}
