import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Order } from "../models/Order.js";
import { OrderEvent } from "../models/OrderEvent.js";
import { logOrderChanges, logOrderEvent, listOrderEvents } from "../services/orders/orderEvents.js";
import { importOrderRows, previewOrderImportRows } from "../services/orders/orderImport.js";
import {
  buildOrderImportTemplateBuffer,
  ORDER_IMPORT_TEMPLATE_FILENAME,
} from "../services/orders/orderImportTemplate.js";
import { serializeOrder } from "../services/orders/serializeOrder.js";
import { getOrderBookableLines } from "../services/orders/orderLineAvailability.js";
import { applyOrderTradeResolution } from "../services/orders/applyOrderTradeResolution.js";
import { paginatedFind, parseListQuery } from "../utils/listQuery.js";
import { logWorkspaceActivity } from "../services/workspaceActivityLog.js";
import { devError } from "../utils/devLog.js";
import {
  applyContractualPartyListFilter,
  canAccessContractualPartyResource,
} from "../services/portal/contractualAccess.js";
import { getTradeAccess } from "../services/tradeMasters/tradeScope.js";
import { companyUsesTradeMasters } from "../services/tradeMasters/resolveOrderTrade.js";
import { getOrderTradePartyOptions } from "../services/orders/orderTradePartyOptions.js";
import { getOrderTradeFacilityOptions } from "../services/tradeMasters/partyFacilityOptions.js";
import { validateOrderInput } from "../services/orders/orderValidation.js";
import { companyObjectId, dbUnavailable } from "./controllerHelpers.js";

export async function listOrders(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const q = applyContractualPartyListFilter({ companyId: companyObjectId(req.user.companyId) }, req);
  const status = String(req.query.status ?? "").trim();
  if (status) q.status = status;

  try {
    const { limit, skip } = parseListQuery(req.query);
    const page = await paginatedFind(Order, q, {
      limit,
      skip,
      serialize: serializeOrder,
    });
    return res.json(page);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list orders." });
  }
}

export async function getOrderBookableLinesHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const orderNumber = String(req.query.orderNumber ?? "").trim();
  if (!orderNumber) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "orderNumber query param is required." });
  }

  const excludeBookingId = String(req.query.excludeBookingId ?? "").trim() || undefined;

  try {
    const result = await getOrderBookableLines(req.user.companyId, orderNumber, { excludeBookingId });
    if (result.errors.length > 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: result.errors.join(" ") });
    }

    const { portalClientId } = getTradeAccess(req);
    if (portalClientId && !canAccessContractualPartyResource(result.order, portalClientId)) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
    }

    return res.json(result);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load bookable order lines." });
  }
}

export async function getOrder(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid order id." });
  }

  try {
    const row = await Order.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    }).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
    }

    const { portalClientId } = getTradeAccess(req);
    if (!canAccessContractualPartyResource(row, portalClientId)) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
    }

    const events = await listOrderEvents(row._id);
    return res.json({ item: serializeOrder(row), events });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load order." });
  }
}

export async function getOrderTradeContext(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  try {
    const usesTradeMasters = await companyUsesTradeMasters(req.user.companyId);
    return res.json({ usesTradeMasters });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load order trade context." });
  }
}

export async function getOrderTradePartyOptionsHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const contractualPartyId = String(req.query.contractualPartyId ?? "").trim();
  if (!contractualPartyId) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "contractualPartyId query param is required.",
    });
  }

  try {
    const { portalClientId } = getTradeAccess(req);
    if (portalClientId && contractualPartyId !== portalClientId) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Contractual customer not found." });
    }

    const result = await getOrderTradePartyOptions(req.user.companyId, contractualPartyId);
    if (result.errors.length > 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: result.errors.join(" ") });
    }
    return res.json(result);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load trade party options." });
  }
}

export async function getOrderTradeFacilityOptionsHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const operatingShipperPartyId = String(req.query.operatingShipperPartyId ?? "").trim();
  const operatingConsigneePartyId = String(req.query.operatingConsigneePartyId ?? "").trim();

  if (!operatingShipperPartyId && !operatingConsigneePartyId) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "operatingShipperPartyId or operatingConsigneePartyId is required.",
    });
  }

  try {
    const options = await getOrderTradeFacilityOptions(req.user.companyId, {
      operatingShipperPartyId,
      operatingConsigneePartyId,
    });
    return res.json(options);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load trade facility options." });
  }
}

export async function createOrder(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { errors: tradeErrors, data: tradeBody } = await applyOrderTradeResolution(
    req.user.companyId,
    req.body ?? {}
  );
  if (tradeErrors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: tradeErrors.join(" ") });
  }

  const { errors, data } = validateOrderInput(tradeBody ?? {});
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const doc = await Order.create({
      companyId: req.user.companyId,
      ...data,
      status: data.status ?? "draft",
    });

    await logOrderEvent({
      orderId: doc._id,
      companyId: req.user.companyId,
      kind: "created",
      message: `Order created (${doc.orderNumber})`,
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
    });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "order.create",
      summary: `Order created: ${doc.orderNumber}`,
      meta: { orderNumber: doc.orderNumber, orderId: String(doc._id) },
    });

    return res.status(201).json({ item: serializeOrder(doc.toObject()) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE_ORDER",
        message: "An order with this order number already exists.",
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create order." });
  }
}

export async function updateOrder(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid order id." });
  }

  const { errors: tradeErrors, data: tradeBody } = await applyOrderTradeResolution(
    req.user.companyId,
    req.body ?? {},
    { partial: true }
  );
  if (tradeErrors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: tradeErrors.join(" ") });
  }

  const { errors, data } = validateOrderInput(tradeBody ?? {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const orderDoc = await Order.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!orderDoc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
    }

    const before = orderDoc.toObject();
    for (const [key, value] of Object.entries(data)) {
      orderDoc[key] = value;
    }
    await orderDoc.save();

    await logOrderChanges({
      orderId: orderDoc._id,
      companyId: req.user.companyId,
      before,
      after: orderDoc.toObject(),
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
    });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "order.update",
      summary: `Order updated: ${orderDoc.orderNumber}`,
      meta: { orderNumber: orderDoc.orderNumber, orderId: String(orderDoc._id) },
    });

    return res.json({ item: serializeOrder(orderDoc.toObject()) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE_ORDER",
        message: "An order with this order number already exists.",
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update order." });
  }
}

export async function deleteOrder(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid order id." });
  }

  try {
    const orderDoc = await Order.findOneAndDelete({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!orderDoc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
    }

    await OrderEvent.deleteMany({ orderId: orderDoc._id });

    void logWorkspaceActivity({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "order.delete",
      summary: `Order deleted: ${orderDoc.orderNumber}`,
      meta: { orderNumber: orderDoc.orderNumber },
    });

    return res.json({ ok: true });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete order." });
  }
}

export function downloadOrderImportTemplate(_req, res) {
  try {
    const buffer = buildOrderImportTemplateBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${ORDER_IMPORT_TEMPLATE_FILENAME}"`);
    return res.send(buffer);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not build import template." });
  }
}

export async function previewImportOrders(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;
  const { sheetName, rows } = parsed;

  if (!rows.length) {
    return res.status(400).json({ error: "EMPTY", message: "The sheet has no data rows." });
  }

  const result = await previewOrderImportRows(rows, req.user.companyId);
  return res.json({ ok: true, sheet: sheetName, ...result });
}

export async function importOrders(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;
  const { sheetName, rows } = parsed;

  if (!rows.length) {
    return res.status(400).json({ error: "EMPTY", message: "The sheet has no data rows." });
  }

  const { created, updated, skipped, errors } = await importOrderRows(rows, req.user.companyId, req.user);

  void logWorkspaceActivity({
    companyId: req.user.companyId,
    userId: req.user.userId,
    actorEmail: req.user.email,
    action: "order.import",
    summary: `Order import · ${created} created, ${updated} updated, ${skipped} skipped (${sheetName})`,
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

export async function listOrderEventsHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid order id." });
  }

  const orderDoc = await Order.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!orderDoc) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
  }

  const { portalClientId } = getTradeAccess(req);
  if (!canAccessContractualPartyResource(orderDoc, portalClientId)) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
  }

  const events = await listOrderEvents(id);
  return res.json({ items: events });
}

export async function createOrderEventHandler(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid order id." });
  }

  const kind = String(req.body?.kind ?? "note").trim();
  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Message is required." });
  }
  if (kind !== "note" && kind !== "milestone") {
    return res.status(400).json({ error: "INVALID_INPUT", message: "kind must be note or milestone." });
  }

  const orderDoc = await Order.findOne({
    _id: id,
    companyId: companyObjectId(req.user.companyId),
  }).lean();
  if (!orderDoc) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Order not found." });
  }

  const event = await logOrderEvent({
    orderId: orderDoc._id,
    companyId: req.user.companyId,
    kind,
    message,
    actorUserId: req.user.userId,
    actorEmail: req.user.email,
    visibleToClient: req.body?.visibleToClient !== false,
  });

  return res.status(201).json({ item: event });
}
