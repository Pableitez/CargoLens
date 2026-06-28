import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { CarrierBookingRequest } from "../models/CarrierBookingRequest.js";
import { ShipperBooking } from "../models/ShipperBooking.js";
import { ShipperBookingEvent } from "../models/ShipperBookingEvent.js";
import {
  importShipperBookingRows,
  previewShipperBookingImportRows,
} from "../services/shipperBookings/shipperBookingImport.js";
import {
  buildShipperBookingImportTemplateBuffer,
  SHIPPER_BOOKING_IMPORT_TEMPLATE_FILENAME,
} from "../services/shipperBookings/shipperBookingImportTemplate.js";
import {
  listShipperBookingEvents,
  logShipperBookingChanges,
  logShipperBookingEvent,
} from "../services/shipperBookings/shipperBookingEvents.js";
import { serializeShipperBooking } from "../services/shipperBookings/serializeShipperBooking.js";
import { validateShipperBookingInput } from "../services/shipperBookings/shipperBookingValidation.js";
import { validateBookingLinesAgainstOrders } from "../services/orders/orderLineAvailability.js";
import { syncOrdersForBooking } from "../services/orders/orderBookingSync.js";
import {
  allocateNextBookingReference,
  isBookingReferenceTaken,
} from "../services/shipperBookings/shipperBookingReference.js";
import { logWorkspaceActivity } from "../services/workspaceActivityLog.js";
import { devError } from "../utils/devLog.js";
import { paginatedFind, parseListQuery } from "../utils/listQuery.js";
import {
  applyShipperBookingListFilter,
  canAccessShipperBooking,
  resolveBookingContractualPartyId,
} from "../services/portal/contractualAccess.js";
import { applyOrderTradeResolution } from "../services/orders/applyOrderTradeResolution.js";
import { getTradeAccess } from "../services/tradeMasters/tradeScope.js";
import { companyObjectId, dbUnavailable, readImportFile } from "./controllerHelpers.js";

export async function getNextBookingReference(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const bookingReference = await allocateNextBookingReference(companyOid);
    return res.json({ bookingReference });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to allocate booking reference." });
  }
}

export async function listShipperBookings(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  let q = { companyId: companyObjectId(req.user.companyId) };
  const status = String(req.query.status ?? "").trim();
  if (status) q.status = status;

  try {
    q = await applyShipperBookingListFilter(q, req);
    const { limit, skip } = parseListQuery(req.query);
    const page = await paginatedFind(ShipperBooking, q, {
      limit,
      skip,
      serialize: serializeShipperBooking,
    });
    return res.json(page);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list shipper bookings." });
  }
}

export async function getShipperBooking(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipper booking id." });
  }

  try {
    const row = await ShipperBooking.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    }).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Shipper booking not found." });
    }

    const { portalClientId } = getTradeAccess(req);
    if (!(await canAccessShipperBooking(row, req.user.companyId, portalClientId))) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Shipper booking not found." });
    }

    const events = await listShipperBookingEvents(row._id);
    return res.json({ item: serializeShipperBooking(row), events });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load shipper booking." });
  }
}

export async function createShipperBooking(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { errors: tradeErrors, data: tradeBody } = await applyOrderTradeResolution(
    req.user.companyId,
    req.body ?? {}
  );
  if (tradeErrors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: tradeErrors.join(" ") });
  }

  const { errors, data } = validateShipperBookingInput(tradeBody ?? {});
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  const availabilityErrors = await validateBookingLinesAgainstOrders(req.user.companyId, data.lines ?? []);
  if (availabilityErrors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: availabilityErrors.join(" ") });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    let bookingReference = data.bookingReference;

    if (!bookingReference) {
      bookingReference = await allocateNextBookingReference(companyOid);
    }

    if (await isBookingReferenceTaken(companyOid, bookingReference)) {
      return res.status(409).json({
        error: "DUPLICATE_BOOKING",
        message: "A shipper booking with this booking reference already exists.",
        nextBookingReference: await allocateNextBookingReference(companyOid),
      });
    }

    const contractualPartyId =
      data.contractualPartyId ??
      (await resolveBookingContractualPartyId(req.user.companyId, data.lines ?? []));

    const doc = await ShipperBooking.create({
      companyId: req.user.companyId,
      ...data,
      bookingReference,
      status: data.status ?? "draft",
      ...(contractualPartyId ? { contractualPartyId } : {}),
    });

    await logShipperBookingEvent({
      shipperBookingId: doc._id,
      companyId: req.user.companyId,
      kind: "created",
      message: `Shipper booking created (${doc.bookingReference})`,
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
    });

    await syncOrdersForBooking(req.user.companyId, doc.toObject(), [], req.user);

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "shipper_booking.create",
      summary: `Shipper booking created: ${doc.bookingReference}`,
      meta: { bookingReference: doc.bookingReference, shipperBookingId: String(doc._id) },
    });

    return res.status(201).json({ item: serializeShipperBooking(doc.toObject()) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE_BOOKING",
        message: "A shipper booking with this booking reference already exists.",
        nextBookingReference: await allocateNextBookingReference(companyObjectId(req.user.companyId)),
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create shipper booking." });
  }
}

export async function updateShipperBooking(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipper booking id." });
  }

  const { errors: tradeErrors, data: tradeBody } = await applyOrderTradeResolution(
    req.user.companyId,
    req.body ?? {},
    { partial: true }
  );
  if (tradeErrors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: tradeErrors.join(" ") });
  }

  const { errors, data } = validateShipperBookingInput(tradeBody ?? {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const bookingDoc = await ShipperBooking.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!bookingDoc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Shipper booking not found." });
    }

    const mergedLines = data.lines ?? bookingDoc.lines.map((line) => line.toObject?.() ?? line);
    const availabilityErrors = await validateBookingLinesAgainstOrders(req.user.companyId, mergedLines, {
      excludeBookingId: id,
    });
    if (availabilityErrors.length > 0) {
      return res.status(400).json({ error: "INVALID_INPUT", message: availabilityErrors.join(" ") });
    }

    const before = bookingDoc.toObject();
    const previousLines = before.lines ?? [];
    for (const [key, value] of Object.entries(data)) {
      bookingDoc[key] = value;
    }

    const linesForParty = bookingDoc.lines.map((line) => line.toObject?.() ?? line);
    const resolvedPartyId =
      data.contractualPartyId ?? (await resolveBookingContractualPartyId(req.user.companyId, linesForParty));
    if (resolvedPartyId) {
      bookingDoc.contractualPartyId = resolvedPartyId;
    }

    await bookingDoc.save();

    await logShipperBookingChanges({
      shipperBookingId: bookingDoc._id,
      companyId: req.user.companyId,
      before,
      after: bookingDoc.toObject(),
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
    });

    await syncOrdersForBooking(req.user.companyId, bookingDoc.toObject(), previousLines, req.user);

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "shipper_booking.update",
      summary: `Shipper booking updated: ${bookingDoc.bookingReference}`,
      meta: { bookingReference: bookingDoc.bookingReference, shipperBookingId: String(bookingDoc._id) },
    });

    return res.json({ item: serializeShipperBooking(bookingDoc.toObject()) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE_BOOKING",
        message: "A shipper booking with this booking reference already exists.",
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update shipper booking." });
  }
}

export async function deleteShipperBooking(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipper booking id." });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const sbOid = new mongoose.Types.ObjectId(id);
    const linkedCarrierBookings = await CarrierBookingRequest.countDocuments({
      companyId: companyOid,
      $or: [{ shipperBookingId: sbOid }, { shipperBookingIds: sbOid }],
    });
    if (linkedCarrierBookings > 0) {
      return res.status(409).json({
        error: "LINKED_CARRIER_BOOKINGS",
        message: "Cannot delete a shipper booking that has linked carrier bookings.",
      });
    }

    const bookingDoc = await ShipperBooking.findOneAndDelete({
      _id: id,
      companyId: companyOid,
    });
    if (!bookingDoc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Shipper booking not found." });
    }

    await ShipperBookingEvent.deleteMany({ shipperBookingId: bookingDoc._id });

    await syncOrdersForBooking(req.user.companyId, bookingDoc.toObject(), [], req.user);

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "shipper_booking.delete",
      summary: `Shipper booking deleted: ${bookingDoc.bookingReference}`,
      meta: { bookingReference: bookingDoc.bookingReference },
    });

    return res.json({ ok: true });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete shipper booking." });
  }
}

export function downloadShipperBookingImportTemplate(_req, res) {
  try {
    const buffer = buildShipperBookingImportTemplateBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${SHIPPER_BOOKING_IMPORT_TEMPLATE_FILENAME}"`
    );
    return res.send(buffer);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not build import template." });
  }
}

export async function previewImportShipperBookings(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;
  const { sheetName, rows } = parsed;

  if (!rows.length) {
    return res.status(400).json({ error: "EMPTY", message: "The sheet has no data rows." });
  }

  const result = previewShipperBookingImportRows(rows);
  return res.json({ ok: true, sheet: sheetName, ...result });
}

export async function importShipperBookings(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;
  const { sheetName, rows } = parsed;

  if (!rows.length) {
    return res.status(400).json({ error: "EMPTY", message: "The sheet has no data rows." });
  }

  const { created, updated, skipped, errors } = await importShipperBookingRows(
    rows,
    req.user.companyId,
    req.user
  );

  void logWorkspaceActivity({
    companyId: req.user.companyId,
    userId: req.user.userId,
    actorEmail: req.user.email,
    action: "shipper_booking.import",
    summary: `Shipper booking import · ${created} created, ${updated} updated, ${skipped} skipped (${sheetName})`,
    meta: { created, updated, skipped, sheet: sheetName, rowsTotal: rows.length },
  });

  return res.json({
    ok: true,
    sheet: sheetName,
    rowsTotal: rows.length,
    created,
    updated,
    skipped,
    errors,
  });
}

export async function listShipperBookingEventsHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipper booking id." });
  }

  const bookingDoc = await ShipperBooking.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!bookingDoc) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Shipper booking not found." });
  }

  const { portalClientId } = getTradeAccess(req);
  if (!(await canAccessShipperBooking(bookingDoc, req.user.companyId, portalClientId))) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Shipper booking not found." });
  }

  const events = await listShipperBookingEvents(id);
  return res.json({ items: events });
}

export async function createShipperBookingEventHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid shipper booking id." });
  }

  const kind = String(req.body?.kind ?? "note").trim();
  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Message is required." });
  }
  if (kind !== "note" && kind !== "milestone") {
    return res.status(400).json({ error: "INVALID_INPUT", message: "kind must be note or milestone." });
  }

  const bookingDoc = await ShipperBooking.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!bookingDoc) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Shipper booking not found." });
  }

  const event = await logShipperBookingEvent({
    shipperBookingId: bookingDoc._id,
    companyId: req.user.companyId,
    kind,
    message,
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    visibleToClient: req.body?.visibleToClient !== false,
  });

  return res.status(201).json({ item: event });
}
