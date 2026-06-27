import mongoose from "mongoose";
import { ShipperBooking } from "../../models/ShipperBooking.js";
import { pickCell } from "../../utils/spreadsheet.js";
import { parseDateCell } from "../import/parseImportCell.js";
import { logShipperBookingEvent } from "./shipperBookingEvents.js";
import { validateShipperBookingInput, validateShipperBookingLineInput } from "./shipperBookingValidation.js";
import { syncOrdersForImport } from "../orders/orderBookingSync.js";
import { validateBookingLinesAgainstOrders } from "../orders/orderLineAvailability.js";
import { resolveBookingContractualPartyId } from "../portal/contractualAccess.js";

function headerFromRow(row) {
  return {
    bookingReference: pickCell(row, "booking_reference", "booking reference", "bookingreference"),
    customerReferenceNumber: pickCell(row, "customer_reference_number", "customer reference number"),
    customer: pickCell(row, "customer", "contractualcustomer", "contractual_customer"),
    shipper: pickCell(row, "shipper"),
    consignee: pickCell(row, "consignee"),
    cargoReadyDate: parseDateCell(pickCell(row, "cargo_ready_date", "cargo ready date")),
    expectedReceiptDate: parseDateCell(pickCell(row, "expected_receipt_date", "expected receipt date")),
    expectedDeliveryDate: parseDateCell(pickCell(row, "expected_delivery_date", "expected delivery date")),
    transportMode: pickCell(row, "transport_mode", "transportmode", "transport mode"),
    placeOfReceipt: pickCell(row, "place_of_receipt", "place of receipt"),
    portOfLoading: pickCell(
      row,
      "port_of_loading",
      "port of loading",
      "airport/portofloading",
      "airport/port_of_loading"
    ),
    portOfDischarge: pickCell(
      row,
      "port_of_discharge",
      "port of discharge",
      "airport/portofdischarge",
      "airport/port_of_discharge"
    ),
    placeOfDelivery: pickCell(row, "place_of_delivery", "place of delivery"),
    incoterm: pickCell(row, "incoterm"),
    incotermLocation: pickCell(row, "incoterm_location", "incoterm location"),
  };
}

function lineFromRow(row) {
  return {
    orderNumber: pickCell(row, "customer_order_number", "customer order number"),
    lineKey: pickCell(row, "customer_order_line_key", "customer order line key", "customerorderlinekey"),
    sku: pickCell(row, "sku_number", "sku number", "skunumber", "sku"),
    description: pickCell(row, "description_of_goods", "description of goods"),
    bookedQuantity: pickCell(row, "booked_quantity", "booked quantity"),
    quantityUnit: pickCell(row, "quantity_unit", "quantity unit", "uom"),
    countryOfOrigin: pickCell(row, "commodity_country_of_origin", "commodity country of origin"),
    bookedVolume: pickCell(row, "booked_volume", "booked volume"),
    bookedWeight: pickCell(row, "booked_weight", "booked weight"),
    externalBusinessId: pickCell(
      row,
      "external_business_identifier",
      "external business identifier",
      "externalbusinessidentifier"
    ),
  };
}

function headerSignature(header) {
  return [
    header.customerReferenceNumber,
    header.customer,
    header.shipper,
    header.consignee,
    header.transportMode,
    header.placeOfReceipt,
    header.portOfLoading,
    header.portOfDischarge,
    header.placeOfDelivery,
    header.incoterm,
    header.incotermLocation,
  ].join("|");
}

export function parseShipperBookingImportRow(row, rowIndex) {
  const header = headerFromRow(row);
  const line = lineFromRow(row);
  const rowNumber = rowIndex + 2;
  const rowErrors = [];

  if (!header.bookingReference) rowErrors.push(`Row ${rowNumber}: booking_reference is required`);
  if (!header.customer) rowErrors.push(`Row ${rowNumber}: customer is required`);
  if (!header.shipper) rowErrors.push(`Row ${rowNumber}: shipper is required`);
  if (!header.consignee) rowErrors.push(`Row ${rowNumber}: consignee is required`);

  const { errors: lineErrors } = validateShipperBookingLineInput(line);
  rowErrors.push(...lineErrors.map((e) => `Row ${rowNumber}: ${e}`));

  return {
    rowNumber,
    bookingReference: header.bookingReference || `(row ${rowNumber})`,
    header,
    line,
    headerSignature: headerSignature(header),
    errors: rowErrors,
    valid: rowErrors.length === 0,
  };
}

export function previewShipperBookingImportRows(rows) {
  const preview = rows.map((row, i) => parseShipperBookingImportRow(row, i));
  const bookingGroups = new Map();

  for (const row of preview) {
    if (!row.valid || !row.header.bookingReference) continue;
    const key = row.header.bookingReference.toUpperCase();
    const existing = bookingGroups.get(key);
    if (existing && existing.headerSignature !== row.headerSignature) {
      row.errors.push(
        `Row ${row.rowNumber}: header fields conflict with other rows for booking ${row.header.bookingReference}`
      );
      row.valid = false;
    } else if (!existing) {
      bookingGroups.set(key, { headerSignature: row.headerSignature });
    }
  }

  const valid = preview.filter((p) => p.valid).length;
  return {
    rowsTotal: rows.length,
    valid,
    invalid: rows.length - valid,
    preview: preview.slice(0, 50).map((p) => ({
      rowNumber: p.rowNumber,
      bookingReference: p.bookingReference,
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

export async function importShipperBookingRows(rows, companyId, actor) {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];
  const grouped = new Map();

  for (let i = 0; i < rows.length; i += 1) {
    const parsed = parseShipperBookingImportRow(rows[i], i);
    if (!parsed.valid) {
      skipped += 1;
      errors.push(...parsed.errors);
      continue;
    }

    const bookingKey = parsed.header.bookingReference.toUpperCase();
    if (!grouped.has(bookingKey)) {
      grouped.set(bookingKey, { header: parsed.header, lines: new Map(), rowNumbers: [] });
    }
    const group = grouped.get(bookingKey);
    if (headerSignature(group.header) !== parsed.headerSignature) {
      skipped += 1;
      errors.push(
        `Row ${parsed.rowNumber}: header fields conflict for booking ${parsed.header.bookingReference}`
      );
      continue;
    }
    group.rowNumbers.push(parsed.rowNumber);
    group.lines.set(parsed.line.lineKey, parsed.line);
  }

  const companyObjectId = new mongoose.Types.ObjectId(companyId);

  for (const [, group] of grouped) {
    const lines = [...group.lines.values()];
    const payload = {
      bookingReference: group.header.bookingReference,
      customerReferenceNumber: group.header.customerReferenceNumber,
      customer: group.header.customer,
      shipper: group.header.shipper,
      consignee: group.header.consignee,
      cargoReadyDate: group.header.cargoReadyDate,
      expectedReceiptDate: group.header.expectedReceiptDate,
      expectedDeliveryDate: group.header.expectedDeliveryDate,
      transportMode: group.header.transportMode,
      placeOfReceipt: group.header.placeOfReceipt,
      portOfLoading: group.header.portOfLoading,
      portOfDischarge: group.header.portOfDischarge,
      placeOfDelivery: group.header.placeOfDelivery,
      incoterm: group.header.incoterm,
      incotermLocation: group.header.incotermLocation,
      lines,
    };

    const { errors: validationErrors, data } = validateShipperBookingInput(payload);
    if (validationErrors.length > 0) {
      skipped += lines.length;
      errors.push(...validationErrors);
      continue;
    }

    const existingLookup = await ShipperBooking.findOne({
      companyId: companyObjectId,
      bookingReference: data.bookingReference,
    }).lean();

    const availabilityErrors = await validateBookingLinesAgainstOrders(companyId, data.lines, {
      excludeBookingId: existingLookup?._id,
    });
    if (availabilityErrors.length > 0) {
      skipped += lines.length;
      errors.push(...availabilityErrors);
      continue;
    }

    try {
      const existing = existingLookup ? await ShipperBooking.findById(existingLookup._id) : null;

      if (existing) {
        const lineMap = new Map(
          existing.lines.map((l) => [`${String(l.orderNumber ?? "").toUpperCase()}|${l.lineKey}`, l])
        );
        for (const line of data.lines) {
          lineMap.set(`${String(line.orderNumber ?? "").toUpperCase()}|${line.lineKey}`, line);
        }
        existing.lines = [...lineMap.values()];
        for (const [key, value] of Object.entries(data)) {
          if (key === "lines" || key === "bookingReference") continue;
          existing[key] = value;
        }
        existing.bookingReference = data.bookingReference;
        existing.contractualPartyId = await resolveBookingContractualPartyId(
          companyId,
          existing.lines.map((l) => l.toObject?.() ?? l)
        );
        await existing.save();
        updated += 1;
        await logShipperBookingEvent({
          shipperBookingId: existing._id,
          companyId,
          kind: "import",
          message: `Import updated ${data.lines.length} line(s)`,
          actorUserId: actor.userId,
          actorEmail: actor.email,
        });
      } else {
        const contractualPartyId = await resolveBookingContractualPartyId(companyId, data.lines ?? []);
        const doc = await ShipperBooking.create({
          companyId,
          ...data,
          status: "draft",
          ...(contractualPartyId ? { contractualPartyId } : {}),
        });
        created += 1;
        await logShipperBookingEvent({
          shipperBookingId: doc._id,
          companyId,
          kind: "created",
          message: `Shipper booking created (${doc.bookingReference})`,
          actorUserId: actor.userId,
          actorEmail: actor.email,
        });
        await logShipperBookingEvent({
          shipperBookingId: doc._id,
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
        errors.push(`Booking ${group.header.bookingReference}: duplicate reference`);
      } else {
        errors.push(`Booking ${group.header.bookingReference}: import failed`);
      }
    }
  }

  await syncOrdersForImport(companyId, grouped, actor);

  return { created, updated, skipped, errors: errors.slice(0, 50) };
}
