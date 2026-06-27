import {
  FACILITY_PORT_FUNCTION,
  facilityCodeValidationError,
  normalizeFacilityCode,
} from "../../../../shared/domain/facilityCode.js";
import { FACILITY_TYPES, isValidFacilityType } from "../../../../shared/domain/tradeMasters.js";

export function serializeFacility(doc) {
  return {
    id: String(doc._id),
    code: doc.code ?? "",
    name: doc.name ?? "",
    facilityType: doc.facilityType ?? "other",
    line1: doc.line1 ?? "",
    line2: doc.line2 ?? "",
    city: doc.city ?? "",
    country: doc.country ?? "",
    postalCode: doc.postalCode ?? "",
    locationCode: doc.locationCode ?? "",
    notes: doc.notes ?? "",
    isActive: doc.isActive !== false,
    catalogSource: doc.catalogSource ?? "manual",
    createdAt: doc.createdAt?.toISOString?.() ?? "",
    updatedAt: doc.updatedAt?.toISOString?.() ?? "",
  };
}

export function validateFacilityInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body?.code !== undefined) {
    const code = normalizeFacilityCode(body?.code);
    const codeError = facilityCodeValidationError(code, {
      allowPortFunction: body?.catalogSource === "unloc",
    });
    if (codeError) errors.push(codeError);
    else data.code = code;
  }

  if (!partial || body?.name !== undefined) {
    const name = String(body?.name ?? "").trim();
    if (!name) errors.push("name is required.");
    else data.name = name.slice(0, 120);
  }

  if (body?.facilityType !== undefined) {
    const facilityType = String(body.facilityType).trim().toLowerCase();
    if (!isValidFacilityType(facilityType)) errors.push("facilityType is invalid.");
    else data.facilityType = facilityType;
  } else if (!partial) {
    data.facilityType = "other";
  }

  if (!partial || body?.line1 !== undefined) {
    data.line1 = String(body?.line1 ?? "")
      .trim()
      .slice(0, 200);
  }
  if (!partial || body?.line2 !== undefined) {
    data.line2 = String(body?.line2 ?? "")
      .trim()
      .slice(0, 200);
  }
  if (!partial || body?.city !== undefined) {
    data.city = String(body?.city ?? "")
      .trim()
      .slice(0, 80);
  }
  if (!partial || body?.country !== undefined) {
    data.country = String(body?.country ?? "")
      .trim()
      .slice(0, 80);
  }
  if (!partial || body?.postalCode !== undefined) {
    data.postalCode = String(body?.postalCode ?? "")
      .trim()
      .slice(0, 32);
  }
  if (!partial || body?.locationCode !== undefined) {
    data.locationCode = String(body?.locationCode ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 10);
  }
  if (!partial || body?.notes !== undefined) {
    data.notes = String(body?.notes ?? "")
      .trim()
      .slice(0, 500);
  }
  if (!partial || body?.isActive !== undefined) {
    data.isActive = Boolean(body?.isActive);
  }

  if (partial && Object.keys(data).length === 0 && errors.length === 0) {
    errors.push("No valid fields to update.");
  }

  return { errors, data };
}

export function facilityTypeLabel(type) {
  return FACILITY_TYPES.includes(type) ? type : "other";
}
