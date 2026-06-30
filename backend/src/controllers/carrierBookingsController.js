import mongoose from "mongoose";
import { getEnv } from "../config/env.js";
import { isDbConnected } from "../db.js";
import { CarrierBookingRequest } from "../models/CarrierBookingRequest.js";
import { ShipperBooking } from "../models/ShipperBooking.js";
import {
  listCarrierBookingEvents,
  logCarrierBookingEvent,
  logCarrierBookingStatusChange,
} from "../services/carrierBookings/carrierBookingEvents.js";
import {
  allocateNextCarrierBookingReference,
  previewNextCarrierBookingReference,
} from "../services/carrierBookings/carrierBookingReference.js";
import { serializeCarrierBooking } from "../services/carrierBookings/serializeCarrierBooking.js";
import { submitCarrierBookingRequest } from "../services/carrierBookings/submitCarrierBooking.js";
import {
  aggregateShipperBookingsForCarrierBooking,
  assertCompatibleShipperBookings,
} from "../services/carrierBookings/aggregateShipperBookings.js";
import {
  applyShipperBookingLinkChanges,
  logShipperBookingLinkEvents,
} from "../services/carrierBookings/linkedShipperBookingUpdates.js";
import { syncShipperBookingsFromCarrierBooking } from "../services/carrierBookings/syncShipperBookingsFromCarrierBooking.js";
import { applyOrderTradeResolution } from "../services/orders/applyOrderTradeResolution.js";
import {
  validateCarrierBookingInput,
  parseShipperBookingIds,
} from "../services/carrierBookings/carrierBookingValidation.js";
import { logWorkspaceActivity } from "../services/workspaceActivityLog.js";
import { devError } from "../utils/devLog.js";
import {
  applyCarrierBookingListFilter,
  canAccessCarrierBooking,
} from "../services/portal/contractualAccess.js";
import { getTradeAccess } from "../services/tradeMasters/tradeScope.js";
import { paginatedFind, parseListQuery } from "../utils/listQuery.js";
import { companyObjectId, dbUnavailable } from "./controllerHelpers.js";

const EDITABLE_STATUSES = new Set(["draft", "rejected", "failed", "acknowledged", "confirmed"]);
const SUBMITTABLE_STATUSES = new Set(["draft", "rejected", "failed", "acknowledged", "confirmed"]);

const CARRIER_BOOKING_ASSIGNABLE_FIELDS = [
  "carrierScac",
  "carrierName",
  "provider",
  "environment",
  "serviceType",
  "freightPaymentTerms",
  "contractNumber",
  "equipment",
  "cargoLines",
  "bookingParty",
  "customer",
  "shipper",
  "consignee",
  "notifyParty",
  "contractualPartyId",
  "supplyChainId",
  "operatingShipperPartyId",
  "operatingConsigneePartyId",
  "placeOfReceiptFacilityId",
  "portOfLoadingFacilityId",
  "portOfDischargeFacilityId",
  "placeOfDeliveryFacilityId",
  "customerReferenceNumber",
  "portOfLoading",
  "portOfDischarge",
  "placeOfReceipt",
  "placeOfDelivery",
  "routingLegs",
  "cargoReadyDate",
  "expectedReceiptDate",
  "expectedDeliveryDate",
  "requestedDepartureDate",
  "incoterm",
  "incotermLocation",
  "cargoDescription",
  "totalGrossWeightKg",
  "totalVolumeCbm",
  "totalPackages",
  "dangerousGoods",
  "specialInstructions",
  "remarks",
];

function assignCarrierBookingFields(doc, data) {
  for (const key of CARRIER_BOOKING_ASSIGNABLE_FIELDS) {
    if (data[key] !== undefined) doc[key] = data[key];
  }
}

async function loadShipperBookingsForCompany(companyOid, shipperBookingIds) {
  const ids = (shipperBookingIds ?? []).filter((id) => mongoose.isValidObjectId(id));
  if (ids.length === 0) return [];

  const rows = await ShipperBooking.find({
    _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
    companyId: companyOid,
  }).lean();

  const byId = new Map(rows.map((row) => [String(row._id), row]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
}

function assertOceanShipperBookings(shipperBookings) {
  for (const sb of shipperBookings) {
    if (sb.transportMode && sb.transportMode !== "ocean" && sb.transportMode !== "") {
      return "Carrier booking via INTTRA is only supported for ocean shipper bookings.";
    }
  }
  return null;
}

function mergeCreatePayload(data, aggregated) {
  const merged = { ...aggregated, ...data };
  if (!merged.cargoLines?.length && aggregated.cargoLines?.length) {
    merged.cargoLines = aggregated.cargoLines;
  }
  if (!merged.cargoDescription && aggregated.cargoDescription) {
    merged.cargoDescription = aggregated.cargoDescription;
  }
  if (merged.totalGrossWeightKg == null && aggregated.totalGrossWeightKg != null) {
    merged.totalGrossWeightKg = aggregated.totalGrossWeightKg;
  }
  if (merged.totalVolumeCbm == null && aggregated.totalVolumeCbm != null) {
    merged.totalVolumeCbm = aggregated.totalVolumeCbm;
  }
  if (merged.totalPackages == null && aggregated.totalPackages != null) {
    merged.totalPackages = aggregated.totalPackages;
  }
  return merged;
}

export async function getNextCarrierBookingReference(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const requestReference = await previewNextCarrierBookingReference(companyOid);
    return res.json({ requestReference, preview: true });
  } catch (err) {
    devError(err);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: "Failed to allocate carrier booking reference." });
  }
}

export async function listCarrierBookings(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  let q = { companyId: companyObjectId(req.user.companyId) };
  const status = String(req.query.status ?? "").trim();
  if (status) q.status = status;
  const shipperBookingId = String(req.query.shipperBookingId ?? "").trim();
  const shipperBookingFilter =
    shipperBookingId && mongoose.isValidObjectId(shipperBookingId)
      ? {
          $or: [
            { shipperBookingId: new mongoose.Types.ObjectId(shipperBookingId) },
            { shipperBookingIds: new mongoose.Types.ObjectId(shipperBookingId) },
          ],
        }
      : null;

  try {
    q = await applyCarrierBookingListFilter(q, req);
    if (shipperBookingFilter) {
      q = { $and: [q, shipperBookingFilter] };
    }
    const { limit, skip } = parseListQuery(req.query);
    const page = await paginatedFind(CarrierBookingRequest, q, {
      limit,
      skip,
      serialize: serializeCarrierBooking,
    });
    return res.json(page);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list carrier bookings." });
  }
}

export async function getCarrierBooking(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid carrier booking id." });
  }

  try {
    const row = await CarrierBookingRequest.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    }).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Carrier booking not found." });
    }

    const { portalClientId } = getTradeAccess(req);
    if (!(await canAccessCarrierBooking(row, req.user.companyId, portalClientId))) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Carrier booking not found." });
    }

    const events = await listCarrierBookingEvents(row._id);
    return res.json({ item: serializeCarrierBooking(row), events });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load carrier booking." });
  }
}

export async function createCarrierBooking(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const companyOid = companyObjectId(req.user.companyId);
  let body = req.body ?? {};

  const earlySbIds = parseShipperBookingIds(body);
  if (earlySbIds.length > 0) {
    const earlyBookings = await loadShipperBookingsForCompany(companyOid, earlySbIds);
    if (earlyBookings.length === earlySbIds.length) {
      const oceanError = assertOceanShipperBookings(earlyBookings);
      if (oceanError) {
        return res.status(400).json({ error: "INVALID_INPUT", message: oceanError });
      }
      const compatError = assertCompatibleShipperBookings(earlyBookings);
      if (compatError) {
        return res.status(400).json({ error: "INVALID_INPUT", message: compatError });
      }
      const aggregated = aggregateShipperBookingsForCarrierBooking(earlyBookings);
      body = {
        ...aggregated,
        ...body,
        shipperBookingIds: earlySbIds,
        shipperBookingReferences: aggregated.shipperBookingReferences,
        shipperBookingReference: aggregated.shipperBookingReference,
      };
    }
  }

  const { errors: tradeErrors, data: tradeBody } = await applyOrderTradeResolution(req.user.companyId, body);
  if (tradeErrors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: tradeErrors.join(" ") });
  }

  const { errors, data } = validateCarrierBookingInput(tradeBody ?? {}, { requireShipperBookings: false });
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  const hasShipperBookings = data.shipperBookingIds.length > 0;
  let shipperBookings = [];
  if (hasShipperBookings) {
    shipperBookings = await loadShipperBookingsForCompany(companyOid, data.shipperBookingIds);
    if (shipperBookings.length !== data.shipperBookingIds.length) {
      return res
        .status(400)
        .json({ error: "INVALID_INPUT", message: "One or more shipper bookings were not found." });
    }

    const oceanError = assertOceanShipperBookings(shipperBookings);
    if (oceanError) {
      return res.status(400).json({ error: "INVALID_INPUT", message: oceanError });
    }

    const compatError = assertCompatibleShipperBookings(shipperBookings);
    if (compatError) {
      return res.status(400).json({ error: "INVALID_INPUT", message: compatError });
    }
  }

  try {
    const requestReference = await allocateNextCarrierBookingReference(companyOid);

    const merged = hasShipperBookings
      ? mergeCreatePayload(data, aggregateShipperBookingsForCarrierBooking(shipperBookings))
      : {
          ...data,
          shipperBookingIds: [],
          shipperBookingReferences: [],
          shipperBookingReference: "",
        };
    const primary = shipperBookings[0] ?? null;

    const doc = await CarrierBookingRequest.create({
      companyId: companyOid,
      requestReference,
      shipperBookingIds: merged.shipperBookingIds ?? [],
      shipperBookingId: primary?._id ?? null,
      shipperBookingReferences: merged.shipperBookingReferences ?? [],
      shipperBookingReference: merged.shipperBookingReference ?? "",
      provider: merged.provider,
      environment: merged.environment,
      carrierScac: merged.carrierScac,
      carrierName: merged.carrierName,
      serviceType: merged.serviceType,
      freightPaymentTerms: merged.freightPaymentTerms,
      contractNumber: merged.contractNumber,
      status: "draft",
      bookingParty: merged.bookingParty,
      customer: merged.customer,
      shipper: merged.shipper,
      consignee: merged.consignee,
      notifyParty: merged.notifyParty,
      contractualPartyId: merged.contractualPartyId ?? null,
      supplyChainId: merged.supplyChainId ?? null,
      operatingShipperPartyId: merged.operatingShipperPartyId ?? null,
      operatingConsigneePartyId: merged.operatingConsigneePartyId ?? null,
      placeOfReceiptFacilityId: merged.placeOfReceiptFacilityId ?? null,
      portOfLoadingFacilityId: merged.portOfLoadingFacilityId ?? null,
      portOfDischargeFacilityId: merged.portOfDischargeFacilityId ?? null,
      placeOfDeliveryFacilityId: merged.placeOfDeliveryFacilityId ?? null,
      customerReferenceNumber: merged.customerReferenceNumber,
      placeOfReceipt: merged.placeOfReceipt,
      portOfLoading: merged.portOfLoading,
      portOfDischarge: merged.portOfDischarge,
      placeOfDelivery: merged.placeOfDelivery,
      routingLegs: merged.routingLegs ?? [],
      cargoReadyDate: merged.cargoReadyDate,
      expectedReceiptDate: merged.expectedReceiptDate,
      expectedDeliveryDate: merged.expectedDeliveryDate,
      requestedDepartureDate: merged.requestedDepartureDate,
      incoterm: merged.incoterm,
      incotermLocation: merged.incotermLocation,
      cargoDescription: merged.cargoDescription,
      totalGrossWeightKg: merged.totalGrossWeightKg,
      totalVolumeCbm: merged.totalVolumeCbm,
      totalPackages: merged.totalPackages,
      dangerousGoods: merged.dangerousGoods,
      cargoLines: merged.cargoLines,
      equipment: merged.equipment,
      specialInstructions: merged.specialInstructions,
      remarks: merged.remarks,
      idempotencyKey: merged.idempotencyKey || requestReference,
    });

    const createdMessage = merged.shipperBookingReference
      ? `Carrier booking ${requestReference} created from SB ${merged.shipperBookingReference}`
      : `Carrier booking ${requestReference} created manually`;

    await logCarrierBookingEvent({
      carrierBookingRequestId: doc._id,
      companyId: companyOid,
      kind: "created",
      message: createdMessage,
      actorUserId: req.user.id,
      actorEmail: req.user.email ?? "",
      meta: {
        shipperBookingIds: merged.shipperBookingIds.map(String),
        carrierScac: merged.carrierScac,
      },
    });

    await logWorkspaceActivity({
      action: "carrier_booking.create",
      companyId: req.user.companyId,
      userId: req.user.id,
      meta: { carrierBookingRequestId: String(doc._id), requestReference },
    });

    return res.status(201).json({ item: serializeCarrierBooking(doc.toObject()) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to create carrier booking." });
  }
}

export async function updateCarrierBooking(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid carrier booking id." });
  }

  const { errors: tradeErrors, data: tradeBody } = await applyOrderTradeResolution(
    req.user.companyId,
    req.body ?? {},
    { partial: true }
  );
  if (tradeErrors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: tradeErrors.join(" ") });
  }

  const { errors, data } = validateCarrierBookingInput(tradeBody ?? {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const existing = await CarrierBookingRequest.findOne({ _id: id, companyId: companyOid });
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Carrier booking not found." });
    }

    if (!EDITABLE_STATUSES.has(existing.status)) {
      return res.status(409).json({
        error: "CONFLICT",
        message: "This carrier booking cannot be edited in its current status.",
      });
    }

    if (data.status && data.status !== existing.status) {
      return res.status(409).json({
        error: "CONFLICT",
        message: "Status cannot be changed via update — use submit to send to the carrier.",
      });
    }

    const before = existing.toObject();
    const previousIds = (existing.shipperBookingIds ?? []).map((value) => String(value));
    const previousRefsById = new Map(
      previousIds.map((id, index) => [id, existing.shipperBookingReferences?.[index] ?? ""])
    );
    let linkChanges = { linkedRefs: [], unlinkedRefs: [] };

    if (data.shipperBookingIdsProvided) {
      const nextIds = data.shipperBookingIds ?? [];
      if (nextIds.length === 0) {
        try {
          linkChanges = applyShipperBookingLinkChanges({
            existing,
            previousIds,
            previousRefsById,
            nextIds: [],
            shipperBookings: [],
            refreshFromShipperBookings: data.refreshFromShipperBookings,
            hasExplicitCargoLines: Array.isArray(req.body?.cargoLines),
          });
        } catch (err) {
          return res.status(400).json({ error: "INVALID_INPUT", message: err.message });
        }
      } else {
        const shipperBookings = await loadShipperBookingsForCompany(companyOid, nextIds);
        if (shipperBookings.length !== nextIds.length) {
          return res
            .status(400)
            .json({ error: "INVALID_INPUT", message: "One or more shipper bookings were not found." });
        }
        const oceanError = assertOceanShipperBookings(shipperBookings);
        if (oceanError) {
          return res.status(400).json({ error: "INVALID_INPUT", message: oceanError });
        }
        try {
          linkChanges = applyShipperBookingLinkChanges({
            existing,
            previousIds,
            previousRefsById,
            nextIds,
            shipperBookings,
            refreshFromShipperBookings: data.refreshFromShipperBookings,
            hasExplicitCargoLines: Array.isArray(req.body?.cargoLines),
          });
        } catch (err) {
          return res.status(400).json({ error: "INVALID_INPUT", message: err.message });
        }
      }
    }

    if (data.carrierScac) {
      existing.carrierScac = data.carrierScac;
      existing.carrierName = data.carrierName;
    }
    assignCarrierBookingFields(existing, data);

    await existing.save();

    if (linkChanges.linkedRefs.length > 0 || linkChanges.unlinkedRefs.length > 0) {
      await logShipperBookingLinkEvents({
        carrierBookingRequestId: existing._id,
        companyOid,
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? "",
        linkedRefs: linkChanges.linkedRefs,
        unlinkedRefs: linkChanges.unlinkedRefs,
      });
    }

    if (before.status !== "draft") {
      await logCarrierBookingEvent({
        carrierBookingRequestId: existing._id,
        companyId: companyOid,
        kind: "note",
        message: "Amendment saved locally — not sent to carrier yet.",
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? "",
        visibleToClient: false,
      });
    }

    await logCarrierBookingStatusChange({
      carrierBookingRequestId: existing._id,
      companyId: companyOid,
      before,
      after: existing.toObject(),
      actorUserId: req.user.id,
      actorEmail: req.user.email ?? "",
    });

    return res.json({ item: serializeCarrierBooking(existing.toObject()) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update carrier booking." });
  }
}

export async function deleteCarrierBooking(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid carrier booking id." });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const existing = await CarrierBookingRequest.findOne({ _id: id, companyId: companyOid }).lean();
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Carrier booking not found." });
    }

    if (existing.status !== "draft") {
      return res.status(409).json({
        error: "CONFLICT",
        message: "Only draft carrier booking requests can be deleted.",
      });
    }

    await CarrierBookingRequest.deleteOne({ _id: id, companyId: companyOid });

    await logWorkspaceActivity({
      action: "carrier_booking.delete",
      companyId: req.user.companyId,
      userId: req.user.id,
      meta: { carrierBookingRequestId: id, requestReference: existing.requestReference },
    });

    return res.json({ ok: true });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to delete carrier booking." });
  }
}

export async function submitCarrierBookingHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid carrier booking id." });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const existing = await CarrierBookingRequest.findOne({ _id: id, companyId: companyOid });
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Carrier booking not found." });
    }

    if (!SUBMITTABLE_STATUSES.has(existing.status)) {
      return res.status(409).json({
        error: "CONFLICT",
        message: `Cannot submit a request in status "${existing.status}".`,
      });
    }

    const before = existing.toObject();
    existing.status = "submitted";
    existing.submittedAt = new Date();
    await existing.save();

    await logCarrierBookingEvent({
      carrierBookingRequestId: existing._id,
      companyId: companyOid,
      kind: "submission",
      message: `Submitted to ${existing.provider.toUpperCase()} (${existing.carrierScac})`,
      actorUserId: req.user.id,
      actorEmail: req.user.email ?? "",
      meta: { carrierScac: existing.carrierScac, environment: existing.environment },
    });

    const env = getEnv();
    let result;
    try {
      result = await submitCarrierBookingRequest(existing.toObject(), env);
    } catch (err) {
      existing.status = "failed";
      existing.rejectionReason = err.message ?? "Submission failed.";
      existing.lastResponse = { error: err.message, code: err.code ?? null };
      existing.lastResponseSource = "inttra";
      await existing.save();

      await logCarrierBookingEvent({
        carrierBookingRequestId: existing._id,
        companyId: companyOid,
        kind: "provider_response",
        message: existing.rejectionReason,
        actorUserId: req.user.id,
        actorEmail: req.user.email ?? "",
        meta: { source: "inttra", failed: true },
      });

      return res.status(502).json({
        error: "SUBMISSION_FAILED",
        message: existing.rejectionReason,
        item: serializeCarrierBooking(existing.toObject()),
      });
    }

    const mapped = result.mapped;
    existing.status = mapped.status;
    existing.externalReference = mapped.externalReference;
    existing.externalStatus = mapped.externalStatus;
    existing.inttraTransactionId = mapped.inttraTransactionId;
    existing.rejectionReason = mapped.rejectionReason ?? "";
    existing.payloadSnapshot = result.payload;
    existing.lastResponse = result.raw;
    existing.lastResponseSource = result.source;
    if (Array.isArray(result.raw?.routingLegs) && result.raw.routingLegs.length > 0) {
      existing.routingLegs = result.raw.routingLegs;
    }
    existing.acknowledgedAt = mapped.acknowledgedAt ?? null;
    existing.confirmedAt = mapped.confirmedAt ?? null;
    existing.rejectedAt = mapped.rejectedAt ?? null;
    await existing.save();

    await syncShipperBookingsFromCarrierBooking(companyOid, existing.toObject(), req.user);

    await logCarrierBookingStatusChange({
      carrierBookingRequestId: existing._id,
      companyId: companyOid,
      before,
      after: existing.toObject(),
      actorUserId: req.user.id,
      actorEmail: req.user.email ?? "",
      meta: { source: result.source },
    });

    const providerMessage =
      mapped.rejectionReason?.trim() ||
      (mapped.externalReference
        ? `Provider acknowledged — ref ${mapped.externalReference}`
        : "Provider response received.");

    await logCarrierBookingEvent({
      carrierBookingRequestId: existing._id,
      companyId: companyOid,
      kind: "provider_response",
      message: providerMessage,
      actorUserId: req.user.id,
      actorEmail: req.user.email ?? "",
      visibleToClient: true,
      meta: {
        source: result.source,
        externalStatus: mapped.externalStatus,
        externalReference: mapped.externalReference,
        inttraTransactionId: mapped.inttraTransactionId,
        rejectionReason: mapped.rejectionReason ?? "",
      },
    });

    await logWorkspaceActivity({
      action: "carrier_booking.submit",
      companyId: req.user.companyId,
      userId: req.user.id,
      meta: {
        carrierBookingRequestId: String(existing._id),
        requestReference: existing.requestReference,
        source: result.source,
        status: existing.status,
      },
    });

    return res.json({
      item: serializeCarrierBooking(existing.toObject()),
      source: result.source,
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to submit carrier booking." });
  }
}

export async function listCarrierBookingEventsHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid carrier booking id." });
  }

  try {
    const row = await CarrierBookingRequest.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    }).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Carrier booking not found." });
    }

    const events = await listCarrierBookingEvents(row._id);
    return res.json({ events });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list carrier booking events." });
  }
}

export async function createCarrierBookingEventHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid carrier booking id." });
  }

  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "message is required." });
  }

  const kind = String(req.body?.kind ?? "note").trim();
  if (kind !== "note") {
    return res
      .status(400)
      .json({ error: "INVALID_INPUT", message: "Only note events can be added manually." });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const row = await CarrierBookingRequest.findOne({ _id: id, companyId: companyOid }).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Carrier booking not found." });
    }

    const item = await logCarrierBookingEvent({
      carrierBookingRequestId: row._id,
      companyId: companyOid,
      kind: "note",
      message,
      actorUserId: req.user.id,
      actorEmail: req.user.email ?? "",
    });

    return res.status(201).json({ item });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to add carrier booking event." });
  }
}
