import mongoose from "mongoose";
import { Order } from "../../models/Order.js";
import { pickCell } from "../../utils/spreadsheet.js";
import { parseDateCell } from "../import/parseImportCell.js";
import { companyUsesTradeMasters, resolveOrderTrade } from "../tradeMasters/resolveOrderTrade.js";
import { logOrderEvent } from "./orderEvents.js";
import { validateOrderInput, validateOrderLineInput } from "./orderValidation.js";
import { applyOrderTradeResolution } from "./applyOrderTradeResolution.js";
import {
  findFacilityOptionByLocationCode,
  getOrderTradeFacilityOptions,
} from "../tradeMasters/partyFacilityOptions.js";
import {
  ORDER_FACILITY_SLOTS,
  facilityIdFieldForSlot,
} from "../../../../shared/domain/partyFacilitySlots.js";
import { normalizeTradeCode } from "../../../../shared/domain/tradeMasters.js";

function headerFromRow(row) {
  return {
    orderNumber: pickCell(row, "order_number", "order number", "order", "po_number", "po number", "po"),
    externalBusinessId: pickCell(row, "external_business_identifier", "external business identifier"),
    contractualCode: pickCell(
      row,
      "contractual_code",
      "contractual code",
      "contractual_customer_code",
      "contractual customer code",
      "customer"
    ),
    supplyChainCode: pickCell(row, "supply_chain_code", "supply chain code"),
    operatingShipperCode: pickCell(
      row,
      "operating_shipper_code",
      "operating shipper code",
      "shipper",
      "shipper_alias_code",
      "shipper alias code"
    ),
    operatingConsigneeCode: pickCell(
      row,
      "operating_consignee_code",
      "operating consignee code",
      "consignee",
      "consignee_alias_code",
      "consignee alias code"
    ),
    shippingWindowStart: parseDateCell(pickCell(row, "shipping_window_start", "shipping window start date")),
    shippingWindowEnd: parseDateCell(pickCell(row, "shipping_window_end", "shipping window end date")),
    transportMode: pickCell(row, "transport_mode", "transport mode"),
    placeOfReceipt: pickCell(row, "place_of_receipt", "place of receipt", "place of receipt code"),
    portOfLoading: pickCell(
      row,
      "port_of_loading",
      "port of loading",
      "port of loading / airport of departure"
    ),
    portOfDischarge: pickCell(
      row,
      "port_of_discharge",
      "port of discharge",
      "port of discharge / airport of arrival"
    ),
    placeOfDelivery: pickCell(row, "place_of_delivery", "place of delivery", "place of delivery code"),
    placeOfReceiptFacilityCode: pickCell(
      row,
      "place_of_receipt_facility",
      "place of receipt facility",
      "place_of_receipt_facility_code"
    ),
    portOfLoadingFacilityCode: pickCell(
      row,
      "port_of_loading_facility",
      "port of loading facility",
      "port_of_loading_facility_code"
    ),
    portOfDischargeFacilityCode: pickCell(
      row,
      "port_of_discharge_facility",
      "port of discharge facility",
      "port_of_discharge_facility_code"
    ),
    placeOfDeliveryFacilityCode: pickCell(
      row,
      "place_of_delivery_facility",
      "place of delivery facility",
      "place_of_delivery_facility_code"
    ),
    incoterm: pickCell(row, "incoterm"),
  };
}

const FACILITY_CODE_HEADER_KEYS = Object.freeze({
  placeOfReceipt: "placeOfReceiptFacilityCode",
  portOfLoading: "portOfLoadingFacilityCode",
  portOfDischarge: "portOfDischargeFacilityCode",
  placeOfDelivery: "placeOfDeliveryFacilityCode",
});

async function resolveHeaderFacilities(companyId, header, tradeFields) {
  const options = await getOrderTradeFacilityOptions(companyId, {
    operatingShipperPartyId: tradeFields.operatingShipperPartyId,
    operatingConsigneePartyId: tradeFields.operatingConsigneePartyId,
  });

  const errors = [];
  const fields = {};

  for (const slot of ORDER_FACILITY_SLOTS) {
    const slotOptions = options[slot] ?? [];
    const facilityCode = String(header[FACILITY_CODE_HEADER_KEYS[slot]] ?? "").trim();
    const locationHint = String(header[slot] ?? "").trim();

    let match = null;
    if (facilityCode) {
      const normalized = normalizeTradeCode(facilityCode);
      match = slotOptions.find((row) => normalizeTradeCode(row.code) === normalized) ?? null;
    } else if (locationHint) {
      match = findFacilityOptionByLocationCode(slotOptions, locationHint);
    }

    if (slotOptions.length > 0 && !match) {
      errors.push(`${slot}: must match a facility linked to the shipper/consignee party`);
    }
    if (match) {
      fields[facilityIdFieldForSlot(slot)] = match.facilityId;
    }
  }

  return { errors, fields };
}

function lineFromRow(row) {
  return {
    lineKey: pickCell(row, "customer_order_line_key", "customer order line key", "line_key"),
    sku: pickCell(row, "sku_number", "sku number", "sku"),
    description: pickCell(row, "description_of_goods", "description of goods"),
    quantity: pickCell(row, "quantity"),
    uom: pickCell(row, "uom"),
    countryOfOrigin: pickCell(row, "commodity_country_of_origin", "commodity country of origin"),
    totalGrossWeight: pickCell(row, "total_gross_weight", "total gross weight"),
    totalCbm: pickCell(row, "total_cbm", "total cbm"),
  };
}

function headerSignature(header) {
  return [
    header.contractualCode,
    header.operatingShipperCode,
    header.operatingConsigneeCode,
    header.externalBusinessId,
    header.transportMode,
    header.placeOfReceipt,
    header.portOfLoading,
    header.portOfDischarge,
    header.placeOfDelivery,
    header.incoterm,
  ].join("|");
}

export function parseOrderImportRow(row, rowIndex, { usesTradeMasters = false } = {}) {
  const header = headerFromRow(row);
  const line = lineFromRow(row);
  const rowNumber = rowIndex + 2;
  const rowErrors = [];

  if (!header.orderNumber) rowErrors.push(`Row ${rowNumber}: order_number is required`);
  if (!header.contractualCode) rowErrors.push(`Row ${rowNumber}: contractual_code (customer) is required`);
  if (usesTradeMasters && !header.operatingShipperCode) {
    rowErrors.push(`Row ${rowNumber}: operating_shipper_code is required when trade masters are configured`);
  }
  if (usesTradeMasters && !header.operatingConsigneeCode) {
    rowErrors.push(
      `Row ${rowNumber}: operating_consignee_code is required when trade masters are configured`
    );
  }
  if (!usesTradeMasters) {
    if (!header.operatingShipperCode) rowErrors.push(`Row ${rowNumber}: shipper is required`);
    if (!header.operatingConsigneeCode) rowErrors.push(`Row ${rowNumber}: consignee is required`);
  }

  const { errors: lineErrors } = validateOrderLineInput(line);
  rowErrors.push(...lineErrors.map((e) => `Row ${rowNumber}: ${e}`));

  return {
    rowNumber,
    orderNumber: header.orderNumber || `(row ${rowNumber})`,
    header,
    line,
    headerSignature: headerSignature(header),
    errors: rowErrors,
    valid: rowErrors.length === 0,
  };
}

export async function previewOrderImportRows(rows, companyId) {
  const usesTradeMasters = await companyUsesTradeMasters(companyId);
  const preview = rows.map((row, i) => parseOrderImportRow(row, i, { usesTradeMasters }));
  const orderGroups = new Map();

  for (const row of preview) {
    if (!row.valid || !row.header.orderNumber) continue;
    const key = row.header.orderNumber.toUpperCase();
    const existing = orderGroups.get(key);
    if (existing && existing.headerSignature !== row.headerSignature) {
      row.errors.push(
        `Row ${row.rowNumber}: header fields conflict with other rows for order ${row.header.orderNumber}`
      );
      row.valid = false;
    } else if (!existing) {
      orderGroups.set(key, { headerSignature: row.headerSignature });
    }
  }

  const valid = preview.filter((p) => p.valid).length;
  return {
    rowsTotal: rows.length,
    valid,
    invalid: rows.length - valid,
    usesTradeMasters,
    preview: preview.slice(0, 50).map((p) => ({
      rowNumber: p.rowNumber,
      orderNumber: p.orderNumber,
      lineKey: p.line.lineKey || "—",
      errors: p.errors,
      valid: p.valid,
    })),
    errors: preview
      .filter((p) => !p.valid)
      .flatMap((p) => p.errors)
      .slice(0, 25),
  };
}

async function findExistingOrder(companyObjectId, orderNumber) {
  const byNew = await Order.findOne({ companyId: companyObjectId, orderNumber }).lean();
  if (byNew) return byNew;
  return Order.findOne({ companyId: companyObjectId, poNumber: orderNumber }).lean();
}

export async function importOrderRows(rows, companyId, actor) {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];
  const grouped = new Map();
  const usesTradeMasters = await companyUsesTradeMasters(companyId);

  for (let i = 0; i < rows.length; i += 1) {
    const parsed = parseOrderImportRow(rows[i], i, { usesTradeMasters });
    if (!parsed.valid) {
      skipped += 1;
      errors.push(...parsed.errors);
      continue;
    }

    const orderKey = parsed.header.orderNumber.toUpperCase();
    if (!grouped.has(orderKey)) {
      grouped.set(orderKey, { header: parsed.header, lines: new Map(), rowNumbers: [] });
    }
    const group = grouped.get(orderKey);
    if (headerSignature(group.header) !== parsed.headerSignature) {
      skipped += 1;
      errors.push(`Row ${parsed.rowNumber}: header fields conflict for order ${parsed.header.orderNumber}`);
      continue;
    }
    group.rowNumbers.push(parsed.rowNumber);
    group.lines.set(parsed.line.lineKey, parsed.line);
  }

  const companyObjectId = new mongoose.Types.ObjectId(companyId);

  for (const [, group] of grouped) {
    const lines = [...group.lines.values()];
    let tradeFields = {};
    if (usesTradeMasters) {
      const resolved = await resolveOrderTrade(companyId, group.header);
      if (resolved.errors.length > 0) {
        skipped += lines.length;
        errors.push(...resolved.errors.map((e) => `Order ${group.header.orderNumber}: ${e}`));
        continue;
      }
      tradeFields = resolved.data;
    }

    const payload = {
      orderNumber: group.header.orderNumber,
      externalBusinessId: group.header.externalBusinessId,
      customer: tradeFields.customer ?? group.header.contractualCode,
      shipper: tradeFields.shipper ?? group.header.operatingShipperCode,
      consignee: tradeFields.consignee ?? group.header.operatingConsigneeCode,
      shippingWindowStart: group.header.shippingWindowStart,
      shippingWindowEnd: group.header.shippingWindowEnd,
      transportMode: group.header.transportMode || tradeFields.transportMode || "",
      incoterm: group.header.incoterm || tradeFields.incoterm || "",
      lines,
      ...(tradeFields.contractualPartyId ? { contractualPartyId: tradeFields.contractualPartyId } : {}),
      ...(tradeFields.supplyChainId ? { supplyChainId: tradeFields.supplyChainId } : {}),
      ...(tradeFields.operatingShipperPartyId
        ? { operatingShipperPartyId: tradeFields.operatingShipperPartyId }
        : {}),
      ...(tradeFields.operatingConsigneePartyId
        ? { operatingConsigneePartyId: tradeFields.operatingConsigneePartyId }
        : {}),
    };

    if (usesTradeMasters) {
      const { errors: facilityErrors, fields: facilityFields } = await resolveHeaderFacilities(
        companyId,
        group.header,
        tradeFields
      );
      if (facilityErrors.length > 0) {
        skipped += lines.length;
        errors.push(...facilityErrors.map((e) => `Order ${group.header.orderNumber}: ${e}`));
        continue;
      }
      Object.assign(payload, facilityFields);

      const { errors: tradeErrors, data } = await applyOrderTradeResolution(companyId, payload);
      if (tradeErrors.length > 0 || !data) {
        skipped += lines.length;
        errors.push(...tradeErrors.map((e) => `Order ${group.header.orderNumber}: ${e}`));
        continue;
      }

      const { errors: validationErrors, data: validated } = validateOrderInput(data);
      if (validationErrors.length > 0) {
        skipped += lines.length;
        errors.push(...validationErrors.map((e) => `Order ${group.header.orderNumber}: ${e}`));
        continue;
      }

      try {
        const existingDoc = await findExistingOrder(companyObjectId, validated.orderNumber);
        const existing = existingDoc ? await Order.findById(existingDoc._id) : null;

        if (existing) {
          const lineMap = new Map(existing.lines.map((l) => [l.lineKey, l]));
          for (const line of validated.lines) {
            lineMap.set(line.lineKey, line);
          }
          existing.lines = [...lineMap.values()];
          for (const [key, value] of Object.entries(validated)) {
            if (key === "lines" || key === "orderNumber") continue;
            existing[key] = value;
          }
          existing.orderNumber = validated.orderNumber;
          await existing.save();
          updated += 1;
          await logOrderEvent({
            orderId: existing._id,
            companyId,
            kind: "import",
            message: `Import updated ${validated.lines.length} line(s)`,
            actorUserId: actor.userId,
            actorEmail: actor.email,
          });
        } else {
          const doc = await Order.create({
            companyId,
            ...validated,
            status: "draft",
          });
          created += 1;
          await logOrderEvent({
            orderId: doc._id,
            companyId,
            kind: "created",
            message: `Order created (${doc.orderNumber})`,
            actorUserId: actor.userId,
            actorEmail: actor.email,
          });
          await logOrderEvent({
            orderId: doc._id,
            companyId,
            kind: "import",
            message: `Import added ${validated.lines.length} line(s)`,
            actorUserId: actor.userId,
            actorEmail: actor.email,
          });
        }
      } catch (err) {
        skipped += lines.length;
        if (err?.code === 11000) {
          errors.push(`Order ${group.header.orderNumber}: duplicate reference`);
        } else {
          errors.push(`Order ${group.header.orderNumber}: import failed`);
        }
      }
      continue;
    }

    Object.assign(payload, {
      placeOfReceipt: group.header.placeOfReceipt,
      portOfLoading: group.header.portOfLoading || tradeFields.portOfLoading || "",
      portOfDischarge: group.header.portOfDischarge || tradeFields.portOfDischarge || "",
      placeOfDelivery: group.header.placeOfDelivery,
    });

    const { errors: validationErrors, data } = validateOrderInput(payload);
    if (validationErrors.length > 0) {
      skipped += lines.length;
      errors.push(...validationErrors.map((e) => `Order ${group.header.orderNumber}: ${e}`));
      continue;
    }

    try {
      const existingDoc = await findExistingOrder(companyObjectId, data.orderNumber);
      const existing = existingDoc ? await Order.findById(existingDoc._id) : null;

      if (existing) {
        const lineMap = new Map(existing.lines.map((l) => [l.lineKey, l]));
        for (const line of data.lines) {
          lineMap.set(line.lineKey, line);
        }
        existing.lines = [...lineMap.values()];
        for (const [key, value] of Object.entries(data)) {
          if (key === "lines" || key === "orderNumber") continue;
          existing[key] = value;
        }
        existing.orderNumber = data.orderNumber;
        await existing.save();
        updated += 1;
        await logOrderEvent({
          orderId: existing._id,
          companyId,
          kind: "import",
          message: `Import updated ${data.lines.length} line(s)`,
          actorUserId: actor.userId,
          actorEmail: actor.email,
        });
      } else {
        const doc = await Order.create({
          companyId,
          ...data,
          status: "draft",
        });
        created += 1;
        await logOrderEvent({
          orderId: doc._id,
          companyId,
          kind: "created",
          message: `Order created (${doc.orderNumber})`,
          actorUserId: actor.userId,
          actorEmail: actor.email,
        });
        await logOrderEvent({
          orderId: doc._id,
          companyId,
          kind: "import",
          message: `Import added ${data.lines.length} line(s)`,
          actorUserId: actor.userId,
          actorEmail: actor.email,
        });
      }
    } catch (err) {
      skipped += lines.length;
      if (err?.code === 11000) {
        errors.push(`Order ${group.header.orderNumber}: duplicate reference`);
      } else {
        errors.push(`Order ${group.header.orderNumber}: import failed`);
      }
    }
  }

  return { created, updated, skipped, errors: errors.slice(0, 50) };
}
