import { MANUAL_ORDER_STATUSES } from "./orderBookingSync.js";
import { normalizeLocationField, ORDER_LOCATION_FIELDS } from "../../data/locations.js";
import {
  INCOTERMS_2020,
  isValidIncoterm,
  isValidOrderStatus,
  isValidTransportMode,
  ORDER_STATUSES,
  ORDER_TRANSPORT_MODES,
} from "../../../../shared/domain/orders.js";

export {
  INCOTERMS_2020,
  isValidIncoterm,
  isValidOrderStatus,
  isValidTransportMode,
  ORDER_STATUSES,
  ORDER_TRANSPORT_MODES,
};

function parseOptionalNumber(value, field, errors) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    errors.push(`${field} must be a non-negative number`);
    return null;
  }
  return n;
}

function parseRequiredQuantity(value, errors) {
  if (value === undefined || value === null || value === "") {
    errors.push("quantity is required");
    return null;
  }
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) {
    errors.push("quantity must be a positive number");
    return null;
  }
  return n;
}

export function validateOrderLineInput(line, { index = 0 } = {}) {
  const errors = [];
  const prefix = `lines[${index}]`;

  const lineKey = String(line?.lineKey ?? line?.customerOrderLineKey ?? "").trim();
  if (!lineKey) errors.push(`${prefix}: lineKey is required`);

  const sku = String(line?.sku ?? line?.skuNumber ?? "").trim();
  if (!sku) errors.push(`${prefix}: sku is required`);

  const uom = String(line?.uom ?? "").trim();
  if (!uom) errors.push(`${prefix}: uom is required`);

  const quantity = parseRequiredQuantity(line?.quantity, errors);

  const data = {
    lineKey,
    sku,
    description: String(line?.description ?? line?.descriptionOfGoods ?? "")
      .trim()
      .slice(0, 500),
    quantity,
    uom,
    countryOfOrigin: String(line?.countryOfOrigin ?? line?.commodityCountryOfOrigin ?? "")
      .trim()
      .slice(0, 80),
    totalGrossWeight: parseOptionalNumber(line?.totalGrossWeight, `${prefix}.totalGrossWeight`, errors),
    totalCbm: parseOptionalNumber(line?.totalCbm, `${prefix}.totalCbm`, errors),
  };

  return { errors, data: errors.length === 0 ? data : null };
}

export function validateOrderInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  const orderNumberRaw = body?.orderNumber ?? body?.poNumber ?? body?.order_number ?? body?.po_number;
  if (!partial || orderNumberRaw !== undefined) {
    const orderNumber = String(orderNumberRaw ?? "").trim();
    if (!orderNumber) errors.push("orderNumber is required");
    else if (orderNumber.length > 80) errors.push("orderNumber must be at most 80 characters");
    else data.orderNumber = orderNumber;
  }

  const customerRaw = body?.customer ?? body?.contractualCustomerCode ?? body?.contractual_customer_code;
  if (!partial || customerRaw !== undefined) {
    const customer = String(customerRaw ?? "").trim();
    if (!customer) errors.push("customer is required");
    else data.customer = customer.slice(0, 120);
  }

  const shipperRaw = body?.shipper ?? body?.shipperAliasCode ?? body?.shipper_alias_code;
  if (!partial || shipperRaw !== undefined) {
    const shipper = String(shipperRaw ?? "").trim();
    if (!shipper) errors.push("shipper is required");
    else data.shipper = shipper.slice(0, 120);
  }

  const consigneeRaw = body?.consignee ?? body?.consigneeAliasCode ?? body?.consignee_alias_code;
  if (!partial || consigneeRaw !== undefined) {
    const consignee = String(consigneeRaw ?? "").trim();
    if (!consignee) errors.push("consignee is required");
    else data.consignee = consignee.slice(0, 120);
  }

  if (body?.externalBusinessId !== undefined) {
    data.externalBusinessId = String(body.externalBusinessId ?? "")
      .trim()
      .slice(0, 80);
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

  for (const field of ORDER_LOCATION_FIELDS) {
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

  if (body?.notes !== undefined) {
    data.notes = String(body.notes ?? "")
      .trim()
      .slice(0, 2000);
  }

  if (body?.status !== undefined) {
    const status = String(body.status ?? "").trim();
    if (!isValidOrderStatus(status)) {
      errors.push(`status must be one of: ${ORDER_STATUSES.join(", ")}`);
    } else if (!MANUAL_ORDER_STATUSES.includes(status)) {
      if (!partial) {
        errors.push("partially_booked and booked are derived from shipper bookings");
      }
    } else {
      data.status = status;
    }
  }

  for (const field of ["shippingWindowStart", "shippingWindowEnd"]) {
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
        const { errors: lineErrors, data: lineData } = validateOrderLineInput(line, { index });
        errors.push(...lineErrors);
        if (lineData) {
          if (lineKeys.has(lineData.lineKey)) {
            errors.push(`duplicate lineKey: ${lineData.lineKey}`);
          } else {
            lineKeys.add(lineData.lineKey);
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
