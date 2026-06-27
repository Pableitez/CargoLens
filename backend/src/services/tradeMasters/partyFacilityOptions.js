import mongoose from "mongoose";
import {
  ORDER_FACILITY_SLOTS,
  facilityIdFieldForSlot,
  isOrderFacilitySlot,
  partySideForFacilitySlot,
} from "../../../../shared/domain/partyFacilitySlots.js";
import { Facility } from "../../models/Facility.js";
import { Party } from "../../models/Party.js";
import { findLocationByCode, normalizeLocationCode } from "../../data/locations.js";

function isSelectablePartyFacility(link, facility) {
  if (!facility || facility.isActive === false) return false;
  const purpose = String(link?.purpose ?? "operates")
    .trim()
    .toLowerCase();
  return purpose !== "billing";
}

export function serializeTradeFacilityOption(facility, link) {
  const locationCode = normalizeLocationCode(facility?.locationCode ?? "");
  return {
    facilityId: String(facility._id),
    code: facility.code ?? "",
    name: facility.name ?? "",
    facilityType: facility.facilityType ?? "warehouse",
    city: facility.city ?? "",
    country: facility.country ?? "",
    locationCode,
    purpose: link?.purpose ?? "operates",
    isPrimary: Boolean(link?.isPrimary),
  };
}

/** All facilities linked to a party in Trade setup (any purpose except billing). */
export async function getPartyLinkedFacilities(companyId, partyId) {
  const id = String(partyId ?? "").trim();
  if (!id || !mongoose.isValidObjectId(id)) {
    return { errors: ["Invalid party id."], options: [] };
  }

  const party = await Party.findOne({
    companyId: new mongoose.Types.ObjectId(companyId),
    _id: id,
  }).lean();

  if (!party) {
    return { errors: ["Party not found."], options: [] };
  }

  const links = party.relatedFacilities ?? [];
  const facilityIds = links.map((row) => row.facilityId).filter(Boolean);
  if (facilityIds.length === 0) {
    return { errors: [], options: [] };
  }

  const facilities = await Facility.find({
    companyId: party.companyId,
    _id: { $in: facilityIds },
  }).lean();
  const facilityById = new Map(facilities.map((row) => [String(row._id), row]));

  const options = [];
  const seen = new Set();
  for (const link of links) {
    const facility = facilityById.get(String(link.facilityId));
    if (!isSelectablePartyFacility(link, facility)) continue;
    const key = String(facility._id);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(serializeTradeFacilityOption(facility, link));
  }

  options.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { errors: [], options };
}

export async function getPartyFacilityOptionsForSlot(companyId, partyId, slot) {
  if (!isOrderFacilitySlot(slot)) {
    return { errors: [`Unknown facility slot: ${slot}`], options: [] };
  }
  return getPartyLinkedFacilities(companyId, partyId);
}

export async function getOrderTradeFacilityOptions(
  companyId,
  { operatingShipperPartyId, operatingConsigneePartyId }
) {
  const shipperId = String(operatingShipperPartyId ?? "").trim();
  const consigneeId = String(operatingConsigneePartyId ?? "").trim();

  const [shipperFacilities, consigneeFacilities] = await Promise.all([
    shipperId ? getPartyLinkedFacilities(companyId, shipperId) : Promise.resolve({ options: [] }),
    consigneeId ? getPartyLinkedFacilities(companyId, consigneeId) : Promise.resolve({ options: [] }),
  ]);

  const result = {};
  for (const slot of ORDER_FACILITY_SLOTS) {
    const side = partySideForFacilitySlot(slot);
    result[slot] = side === "shipper" ? shipperFacilities.options : consigneeFacilities.options;
  }

  return result;
}

function locationTextForFacility(facility) {
  const locationCode = normalizeLocationCode(facility?.locationCode ?? "");
  if (locationCode) {
    const known = findLocationByCode(locationCode);
    if (known) return known.code;
  }
  return "";
}

export async function validateFacilityAllowed(companyId, partyId, _slot, facilityId) {
  const { errors, options } = await getPartyLinkedFacilities(companyId, partyId);
  if (errors.length > 0) return { errors, facility: null };

  const id = String(facilityId ?? "").trim();
  const match = options.find((row) => row.facilityId === id);
  if (!match) {
    return {
      errors: ["Selected facility is not linked to this party in Trade setup."],
      facility: null,
    };
  }

  const facility = await Facility.findOne({
    companyId: new mongoose.Types.ObjectId(companyId),
    _id: id,
  }).lean();

  return { errors: [], facility, option: match };
}

export async function applyOrderFacilityResolution(companyId, body, { partial = false } = {}) {
  const merged = { ...body };
  const errors = [];

  const shipperId = String(merged.operatingShipperPartyId ?? merged.shipperPartyId ?? "").trim();
  const consigneeId = String(merged.operatingConsigneePartyId ?? merged.consigneePartyId ?? "").trim();

  const hasAnyFacilityField = ORDER_FACILITY_SLOTS.some(
    (slot) => merged[facilityIdFieldForSlot(slot)] !== undefined
  );
  if (partial && !hasAnyFacilityField) {
    return { errors: [], data: merged };
  }

  for (const slot of ORDER_FACILITY_SLOTS) {
    const idField = facilityIdFieldForSlot(slot);
    const partySide = partySideForFacilitySlot(slot);
    const partyId = partySide === "shipper" ? shipperId : consigneeId;
    const facilityId = String(merged[idField] ?? "").trim();

    if (!partyId) {
      if (facilityId) {
        errors.push(`${slot}: select ${partySide} before choosing a facility.`);
      }
      continue;
    }

    const { options } = await getPartyLinkedFacilities(companyId, partyId);

    if (!facilityId) {
      if (!partial && options.length > 0) {
        errors.push(`${slot}: select a facility linked to the ${partySide} party.`);
      }
      merged[slot] = merged[slot] ?? "";
      continue;
    }

    const { errors: slotErrors, facility } = await validateFacilityAllowed(
      companyId,
      partyId,
      slot,
      facilityId
    );
    errors.push(...slotErrors);
    if (!facility) continue;

    merged[idField] = String(facility._id);
    merged[slot] = locationTextForFacility(facility);
  }

  if (errors.length > 0) {
    return { errors, data: null };
  }

  return { errors: [], data: merged };
}

export function findFacilityOptionByLocationCode(options, locationCode) {
  const code = normalizeLocationCode(locationCode);
  if (!code) return null;
  return (
    options.find((row) => normalizeLocationCode(row.locationCode) === code) ??
    options.find((row) => normalizeLocationCode(row.code) === code) ??
    null
  );
}
