import {
  INCOTERMS_2020,
  isValidIncoterm,
  isValidTransportMode,
  ORDER_TRANSPORT_MODES,
} from "../../../../shared/domain/orders.js";
import {
  isValidShipperBookingStatus,
  SHIPPER_BOOKING_STATUSES,
} from "../../../../shared/domain/shipperBookings.js";
import { BOOKING_LOCATION_FIELDS, normalizeLocationField } from "../../data/locations.js";

export { INCOTERMS_2020, ORDER_TRANSPORT_MODES, SHIPPER_BOOKING_STATUSES };

export { isValidShipperBookingStatus };

function normalizeOrderNumberForDedupe(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function parseOptionalNumber(value, field, errors) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    errors.push(`${field} must be a non-negative number`);
    return null;
  }
  return n;
}

function parseRequiredBookedQuantity(value, errors) {
  if (value === undefined || value === null || value === "") {
    errors.push("bookedQuantity is required");
    return null;
  }
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) {
    errors.push("bookedQuantity must be a positive number");
    return null;
  }
  return n;
}

export function validateShipperBookingLineInput(line, { index = 0 } = {}) {
  const errors = [];
  const prefix = `lines[${index}]`;

  const lineKey = String(
    line?.lineKey ?? line?.customerOrderLineKey ?? line?.customer_order_line_key ?? ""
  ).trim();
  if (!lineKey) errors.push(`${prefix}: lineKey is required`);

  const sku = String(line?.sku ?? line?.skuNumber ?? line?.sku_number ?? "").trim();
  if (!sku) errors.push(`${prefix}: sku is required`);

  const quantityUnit = String(line?.quantityUnit ?? line?.uom ?? line?.quantity_unit ?? "").trim();
  if (!quantityUnit) errors.push(`${prefix}: quantityUnit is required`);

  const bookedQuantity = parseRequiredBookedQuantity(
    line?.bookedQuantity ?? line?.quantity ?? line?.booked_quantity,
    errors
  );

  const data = {
    lineKey,
    orderNumber: String(line?.orderNumber ?? line?.customerOrderNumber ?? line?.customer_order_number ?? "")
      .trim()
      .slice(0, 80),
    sku,
    externalBusinessId: String(
      line?.externalBusinessId ?? line?.externalBusinessIdentifier ?? line?.external_business_identifier ?? ""
    )
      .trim()
      .slice(0, 80),
    bookedQuantity,
    quantityUnit,
    bookedPackages: parseOptionalNumber(
      line?.bookedPackages ?? line?.booked_packages,
      `${prefix}.bookedPackages`,
      errors
    ),
    packagesUnit: String(line?.packagesUnit ?? line?.packages_unit ?? "")
      .trim()
      .slice(0, 40),
    bookedVolume: parseOptionalNumber(
      line?.bookedVolume ?? line?.booked_volume,
      `${prefix}.bookedVolume`,
      errors
    ),
    bookedWeight: parseOptionalNumber(
      line?.bookedWeight ?? line?.booked_weight,
      `${prefix}.bookedWeight`,
      errors
    ),
    description: String(line?.description ?? line?.descriptionOfGoods ?? line?.description_of_goods ?? "")
      .trim()
      .slice(0, 500),
    countryOfOrigin: String(
      line?.countryOfOrigin ?? line?.commodityCountryOfOrigin ?? line?.commodity_country_of_origin ?? ""
    )
      .trim()
      .slice(0, 80),
    commodityCode: String(line?.commodityCode ?? line?.commodity_code ?? "")
      .trim()
      .slice(0, 80),
  };

  return { errors, data: errors.length === 0 ? data : null };
}

export function validateShipperBookingInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  const bookingRefRaw = body?.bookingReference ?? body?.booking_reference ?? body?.bookingReferenceNumber;
  if (!partial || bookingRefRaw !== undefined) {
    const bookingReference = String(bookingRefRaw ?? "").trim();
    if (!bookingReference) errors.push("bookingReference is required");
    else if (bookingReference.length > 80) {
      errors.push("bookingReference must be at most 80 characters");
    } else {
      data.bookingReference = bookingReference;
    }
  }

  const customerRaw = body?.customer ?? body?.contractualCustomer ?? body?.contractual_customer;
  if (!partial || customerRaw !== undefined) {
    const customer = String(customerRaw ?? "").trim();
    if (!customer) errors.push("customer is required");
    else data.customer = customer.slice(0, 120);
  }

  const shipperRaw = body?.shipper;
  if (!partial || shipperRaw !== undefined) {
    const shipper = String(shipperRaw ?? "").trim();
    if (!shipper) errors.push("shipper is required");
    else data.shipper = shipper.slice(0, 120);
  }

  const consigneeRaw = body?.consignee;
  if (!partial || consigneeRaw !== undefined) {
    const consignee = String(consigneeRaw ?? "").trim();
    if (!consignee) errors.push("consignee is required");
    else data.consignee = consignee.slice(0, 120);
  }

  for (const field of [
    "contractualPartyId",
    "supplyChainId",
    "operatingShipperPartyId",
    "operatingConsigneePartyId",
    "placeOfReceiptFacilityId",
    "portOfLoadingFacilityId",
    "portOfDischargeFacilityId",
    "placeOfDeliveryFacilityId",
  ]) {
    if (body?.[field] === undefined) continue;
    const id = String(body[field] ?? "").trim();
    if (id) data[field] = id;
  }

  if (body?.customerReferenceNumber !== undefined) {
    data.customerReferenceNumber = String(body.customerReferenceNumber ?? "")
      .trim()
      .slice(0, 80);
  }

  if (body?.transportMode !== undefined) {
    const transportMode = String(body.transportMode ?? "")
      .trim()
      .toLowerCase();
    if (!isValidTransportMode(transportMode)) {
      errors.push(`transportMode must be one of: ${ORDER_TRANSPORT_MODES.filter(Boolean).join(", ")}`);
    } else {
      data.transportMode = transportMode;
    }
  }

  for (const field of BOOKING_LOCATION_FIELDS) {
    if (body?.[field] === undefined) continue;
    const normalized = normalizeLocationField(body[field], field);
    if (!normalized.ok) errors.push(normalized.error);
    else data[field] = normalized.code;
  }

  if (body?.incoterm !== undefined) {
    const incoterm = String(body.incoterm ?? "")
      .trim()
      .toUpperCase();
    if (!isValidIncoterm(incoterm)) {
      errors.push(`incoterm must be one of: ${INCOTERMS_2020.join(", ")}`);
    } else {
      data.incoterm = incoterm;
    }
  }

  if (body?.remarks !== undefined) {
    data.remarks = String(body.remarks ?? "")
      .trim()
      .slice(0, 2000);
  }

  if (body?.status !== undefined) {
    const status = String(body.status ?? "").trim();
    if (!isValidShipperBookingStatus(status)) {
      errors.push(`status must be one of: ${SHIPPER_BOOKING_STATUSES.join(", ")}`);
    } else {
      data.status = status;
    }
  }

  for (const field of ["cargoReadyDate", "expectedReceiptDate", "expectedDeliveryDate"]) {
    if (body?.[field] === undefined) continue;
    if (body[field] === null || body[field] === "") {
      data[field] = null;
      continue;
    }
    const d = new Date(body[field]);
    if (Number.isNaN(d.getTime())) {
      errors.push(`${field} must be a valid date`);
    } else {
      data[field] = d;
    }
  }

  if (body?.lines !== undefined) {
    if (!Array.isArray(body.lines)) {
      errors.push("lines must be an array");
    } else if (!partial && body.lines.length === 0) {
      errors.push("lines must contain at least one item");
    } else {
      const parsedLines = [];
      const lineKeys = new Set();
      body.lines.forEach((line, index) => {
        const { errors: lineErrors, data: lineData } = validateShipperBookingLineInput(line, { index });
        errors.push(...lineErrors);
        if (lineData) {
          const dedupeKey = `${normalizeOrderNumberForDedupe(lineData.orderNumber)}|${lineData.lineKey}`;
          if (lineKeys.has(dedupeKey)) {
            errors.push(`duplicate order line: ${lineData.orderNumber || "(direct)"} / ${lineData.lineKey}`);
          } else {
            lineKeys.add(dedupeKey);
            parsedLines.push(lineData);
          }
        }
      });
      if (parsedLines.length > 0 || partial) {
        data.lines = parsedLines;
      }
    }
  }

  return { errors, data };
}
