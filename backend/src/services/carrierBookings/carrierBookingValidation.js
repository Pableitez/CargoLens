import { isValidIncoterm } from "../../../../shared/domain/orders.js";
import {
  CARRIER_BOOKING_ENVIRONMENTS,
  CARRIER_BOOKING_PROVIDERS,
  CARRIER_BOOKING_STATUSES,
  CARRIER_FREIGHT_PAYMENT_TERMS,
  CARRIER_SERVICE_TYPES,
  CONTAINER_EQUIPMENT_TYPES,
  carrierNameFromScac,
  isValidCarrierBookingEnvironment,
  isValidCarrierBookingProvider,
  isValidCarrierBookingStatus,
  isValidCarrierFreightPaymentTerm,
  isValidCarrierServiceType,
  normalizeCarrierScac,
} from "../../../../shared/domain/carrierBookings.js";
import { serializeCargoLine } from "./aggregateShipperBookings.js";

export {
  CARRIER_BOOKING_ENVIRONMENTS,
  CARRIER_BOOKING_PROVIDERS,
  CARRIER_BOOKING_STATUSES,
  CARRIER_FREIGHT_PAYMENT_TERMS,
  CARRIER_SERVICE_TYPES,
  CONTAINER_EQUIPMENT_TYPES,
  isValidCarrierBookingStatus,
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

function parseRequiredPositiveInt(value, field, errors) {
  if (value === undefined || value === null || value === "") {
    errors.push(`${field} is required`);
    return null;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    errors.push(`${field} must be a positive integer`);
    return null;
  }
  return n;
}

function parseOptionalDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseShipperBookingIds(raw) {
  const ids = [];
  if (Array.isArray(raw?.shipperBookingIds)) {
    for (const id of raw.shipperBookingIds) {
      const key = String(id ?? "").trim();
      if (key) ids.push(key);
    }
  }
  const legacy = String(raw?.shipperBookingId ?? "").trim();
  if (legacy && !ids.includes(legacy)) ids.unshift(legacy);
  return [...new Set(ids)];
}

export { parseShipperBookingIds };

export function validateCarrierBookingEquipmentInput(equipment, { index = 0 } = {}) {
  const errors = [];
  const prefix = `equipment[${index}]`;

  const quantity = parseRequiredPositiveInt(equipment?.quantity, `${prefix}.quantity`, errors);
  const equipmentType = String(equipment?.equipmentType ?? equipment?.type ?? "")
    .trim()
    .toUpperCase();
  if (!equipmentType) {
    errors.push(`${prefix}.equipmentType is required`);
  } else if (!CONTAINER_EQUIPMENT_TYPES.includes(equipmentType)) {
    errors.push(`${prefix}.equipmentType must be a supported container type`);
  }

  return {
    errors,
    data: {
      quantity,
      equipmentType,
      weightKg: parseOptionalNumber(
        equipment?.weightKg ?? equipment?.weight_kg,
        `${prefix}.weightKg`,
        errors
      ),
      volumeCbm: parseOptionalNumber(
        equipment?.volumeCbm ?? equipment?.volume_cbm,
        `${prefix}.volumeCbm`,
        errors
      ),
      shipperOwned: equipment?.shipperOwned === true || equipment?.shipper_owned === true,
    },
  };
}

function validateCargoLineInput(line, { index = 0 } = {}) {
  const errors = [];
  const prefix = `cargoLines[${index}]`;
  const lineKey = String(line?.lineKey ?? "").trim();
  const sku = String(line?.sku ?? "").trim();
  const quantityUnit = String(line?.quantityUnit ?? line?.quantity_unit ?? "").trim();
  if (!lineKey) errors.push(`${prefix}.lineKey is required`);
  if (!sku) errors.push(`${prefix}.sku is required`);
  if (!quantityUnit) errors.push(`${prefix}.quantityUnit is required`);

  const bookedQuantity = parseOptionalNumber(
    line?.bookedQuantity ?? line?.booked_quantity,
    `${prefix}.bookedQuantity`,
    errors
  );
  if (bookedQuantity === null && lineKey) errors.push(`${prefix}.bookedQuantity is required`);

  return {
    errors,
    data: serializeCargoLine({
      sourceShipperBookingReference:
        line?.sourceShipperBookingReference ?? line?.source_shipper_booking_reference ?? "",
      lineKey,
      orderNumber: line?.orderNumber ?? "",
      sku,
      externalBusinessId: line?.externalBusinessId ?? "",
      bookedQuantity: bookedQuantity ?? 0,
      quantityUnit,
      bookedPackages: parseOptionalNumber(line?.bookedPackages, `${prefix}.bookedPackages`, errors),
      packagesUnit: line?.packagesUnit ?? "",
      bookedVolume: parseOptionalNumber(line?.bookedVolume, `${prefix}.bookedVolume`, errors),
      bookedWeight: parseOptionalNumber(line?.bookedWeight, `${prefix}.bookedWeight`, errors),
      description: line?.description ?? "",
      countryOfOrigin: line?.countryOfOrigin ?? "",
      commodityCode: line?.commodityCode ?? "",
    }),
  };
}

function parseOptionalObjectId(value) {
  const key = String(value ?? "").trim();
  if (!key) return null;
  return key;
}

const ROUTING_LEG_MODES = new Set(["road", "ocean", "rail", "transshipment"]);

function validateRoutingLegsInput(rawLegs) {
  if (!Array.isArray(rawLegs)) {
    return { errors: ["routingLegs must be an array"], data: undefined };
  }

  const errors = [];
  const legs = [];

  rawLegs.forEach((leg, index) => {
    const prefix = `routingLegs[${index}]`;
    let transportMode = String(leg?.transportMode ?? "ocean")
      .trim()
      .toLowerCase();
    if (!ROUTING_LEG_MODES.has(transportMode)) transportMode = "ocean";

    const originCode = String(leg?.originCode ?? leg?.portOfLoading ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 20);
    const destinationCode = String(leg?.destinationCode ?? leg?.portOfDischarge ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 20);
    const portOfLoading = String(leg?.portOfLoading ?? originCode)
      .trim()
      .toUpperCase()
      .slice(0, 20);
    const portOfDischarge = String(leg?.portOfDischarge ?? destinationCode)
      .trim()
      .toUpperCase()
      .slice(0, 20);

    if (!originCode) errors.push(`${prefix}.originCode is required`);
    if (!destinationCode) errors.push(`${prefix}.destinationCode is required`);

    const isOcean = transportMode === "ocean" || transportMode === "transshipment";

    legs.push({
      sequence: Number(leg?.sequence) > 0 ? Number(leg.sequence) : index + 1,
      transportMode,
      originCode,
      destinationCode,
      portOfLoading,
      portOfDischarge,
      vesselName: isOcean
        ? String(leg?.vesselName ?? "")
            .trim()
            .slice(0, 120)
        : "",
      voyageNumber: isOcean
        ? String(leg?.voyageNumber ?? "")
            .trim()
            .slice(0, 80)
        : "",
      etd: isOcean ? parseOptionalDate(leg?.etd) : null,
      eta: isOcean ? parseOptionalDate(leg?.eta) : null,
    });
  });

  return { errors, data: legs };
}

export function validateCarrierBookingInput(body, { partial = false, requireShipperBookings = true } = {}) {
  const errors = [];
  const raw = body ?? {};

  const shipperBookingIds = parseShipperBookingIds(raw);
  if (!partial && requireShipperBookings && shipperBookingIds.length === 0) {
    errors.push("At least one shipperBookingId is required");
  }

  const carrierScac = normalizeCarrierScac(raw.carrierScac ?? raw.carrier_scac);
  if (!partial && !carrierScac) errors.push("carrierScac is required");
  if (carrierScac && carrierScac.length !== 4) errors.push("carrierScac must be a 4-letter SCAC code");

  let provider = String(raw.provider ?? "inttra")
    .trim()
    .toLowerCase();
  if (!provider) provider = "inttra";
  if (!isValidCarrierBookingProvider(provider)) {
    errors.push(`provider must be one of: ${CARRIER_BOOKING_PROVIDERS.join(", ")}`);
  }

  let environment = String(raw.environment ?? "mock")
    .trim()
    .toLowerCase();
  if (!environment) environment = "mock";
  if (!isValidCarrierBookingEnvironment(environment)) {
    errors.push(`environment must be one of: ${CARRIER_BOOKING_ENVIRONMENTS.join(", ")}`);
  }

  let serviceType = String(raw.serviceType ?? "FCL")
    .trim()
    .toUpperCase();
  if (!serviceType) serviceType = "FCL";
  if (!isValidCarrierServiceType(serviceType)) {
    errors.push(`serviceType must be one of: ${CARRIER_SERVICE_TYPES.join(", ")}`);
  }

  let freightPaymentTerms = String(raw.freightPaymentTerms ?? raw.freight_payment_terms ?? "")
    .trim()
    .toLowerCase();
  if (!isValidCarrierFreightPaymentTerm(freightPaymentTerms)) {
    errors.push(`freightPaymentTerms must be one of: ${CARRIER_FREIGHT_PAYMENT_TERMS.join(", ")}`);
  }

  const incoterm = String(raw.incoterm ?? "")
    .trim()
    .toUpperCase();
  if (incoterm && !isValidIncoterm(incoterm)) {
    errors.push("incoterm must be a valid ICC 2020 code");
  }

  let status = String(raw.status ?? "draft")
    .trim()
    .toLowerCase();
  if (!status) status = "draft";
  if (raw.status !== undefined && !isValidCarrierBookingStatus(status)) {
    errors.push(`status must be one of: ${CARRIER_BOOKING_STATUSES.join(", ")}`);
  }

  const equipmentRows = Array.isArray(raw.equipment) ? raw.equipment : [];
  const equipment = [];
  for (let i = 0; i < equipmentRows.length; i += 1) {
    const row = validateCarrierBookingEquipmentInput(equipmentRows[i], { index: i });
    errors.push(...row.errors);
    if (row.errors.length === 0) equipment.push(row.data);
  }

  if (!partial && equipment.length === 0) {
    errors.push("At least one equipment line is required");
  }

  const cargoLineRows = Array.isArray(raw.cargoLines) ? raw.cargoLines : [];
  const cargoLines = [];
  for (let i = 0; i < cargoLineRows.length; i += 1) {
    const row = validateCargoLineInput(cargoLineRows[i], { index: i });
    errors.push(...row.errors);
    if (row.errors.length === 0) cargoLines.push(row.data);
  }

  let routingLegs;
  if (raw.routingLegs !== undefined) {
    const routingResult = validateRoutingLegsInput(raw.routingLegs);
    errors.push(...routingResult.errors);
    routingLegs = routingResult.data;
  }

  const data = {
    shipperBookingIds,
    shipperBookingId: shipperBookingIds[0],
    requestReference: String(raw.requestReference ?? "").trim(),
    carrierScac,
    carrierName: carrierNameFromScac(carrierScac),
    provider,
    environment,
    serviceType,
    freightPaymentTerms,
    contractNumber: String(raw.contractNumber ?? raw.contract_number ?? "")
      .trim()
      .slice(0, 80),
    status,
    equipment,
    cargoLines,
    bookingParty: String(raw.bookingParty ?? raw.booking_party ?? "")
      .trim()
      .slice(0, 200),
    customer: String(raw.customer ?? "")
      .trim()
      .slice(0, 200),
    shipper: String(raw.shipper ?? "")
      .trim()
      .slice(0, 200),
    consignee: String(raw.consignee ?? "")
      .trim()
      .slice(0, 200),
    notifyParty: String(raw.notifyParty ?? raw.notify_party ?? "")
      .trim()
      .slice(0, 200),
    contractualPartyId: parseOptionalObjectId(raw.contractualPartyId),
    supplyChainId: parseOptionalObjectId(raw.supplyChainId),
    operatingShipperPartyId: parseOptionalObjectId(raw.operatingShipperPartyId),
    operatingConsigneePartyId: parseOptionalObjectId(raw.operatingConsigneePartyId),
    placeOfReceiptFacilityId: parseOptionalObjectId(raw.placeOfReceiptFacilityId),
    portOfLoadingFacilityId: parseOptionalObjectId(raw.portOfLoadingFacilityId),
    portOfDischargeFacilityId: parseOptionalObjectId(raw.portOfDischargeFacilityId),
    placeOfDeliveryFacilityId: parseOptionalObjectId(raw.placeOfDeliveryFacilityId),
    customerReferenceNumber: String(raw.customerReferenceNumber ?? raw.customer_reference_number ?? "")
      .trim()
      .slice(0, 80),
    portOfLoading: String(raw.portOfLoading ?? "").trim(),
    portOfDischarge: String(raw.portOfDischarge ?? "").trim(),
    placeOfReceipt: String(raw.placeOfReceipt ?? "").trim(),
    placeOfDelivery: String(raw.placeOfDelivery ?? "").trim(),
    cargoReadyDate: parseOptionalDate(raw.cargoReadyDate),
    expectedReceiptDate: parseOptionalDate(raw.expectedReceiptDate),
    expectedDeliveryDate: parseOptionalDate(raw.expectedDeliveryDate),
    requestedDepartureDate: parseOptionalDate(raw.requestedDepartureDate),
    incoterm,
    incotermLocation: String(raw.incotermLocation ?? "")
      .trim()
      .slice(0, 120),
    cargoDescription: String(raw.cargoDescription ?? raw.cargo_description ?? "")
      .trim()
      .slice(0, 500),
    totalGrossWeightKg: parseOptionalNumber(
      raw.totalGrossWeightKg ?? raw.total_gross_weight_kg,
      "totalGrossWeightKg",
      errors
    ),
    totalVolumeCbm: parseOptionalNumber(raw.totalVolumeCbm ?? raw.total_volume_cbm, "totalVolumeCbm", errors),
    totalPackages: parseOptionalNumber(raw.totalPackages ?? raw.total_packages, "totalPackages", errors),
    dangerousGoods: raw.dangerousGoods === true || raw.dangerous_goods === true,
    specialInstructions: String(raw.specialInstructions ?? raw.special_instructions ?? "")
      .trim()
      .slice(0, 2000),
    remarks: String(raw.remarks ?? "")
      .trim()
      .slice(0, 2000),
    idempotencyKey: String(raw.idempotencyKey ?? "")
      .trim()
      .slice(0, 120),
    shipperBookingIdsProvided: Array.isArray(raw?.shipperBookingIds),
    refreshFromShipperBookings: raw?.refreshFromShipperBookings === true,
  };

  if (routingLegs !== undefined) {
    data.routingLegs = routingLegs;
  }

  return { errors, data };
}
