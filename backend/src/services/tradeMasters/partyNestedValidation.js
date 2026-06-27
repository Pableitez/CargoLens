import mongoose from "mongoose";
import {
  PARTY_ADDRESS_LABELS,
  PARTY_RELATIONSHIP_TYPES,
  PARTY_ROLES,
  isValidPartyAddressLabel,
  isValidPartyFacilityPurpose,
  isValidPartyRelationshipType,
  isValidPartyRole,
  isValidRelatedPartyLinkType,
  normalizePartyClientAlias,
  partyClientAliasLookupKey,
} from "../../../../shared/domain/tradeMasters.js";

const MAX_NESTED_ITEMS = 50;

function subId(doc) {
  return doc._id ? String(doc._id) : undefined;
}

export function serializePartyAddress(doc) {
  return {
    id: subId(doc),
    label: doc.label ?? "registered",
    line1: doc.line1 ?? "",
    line2: doc.line2 ?? "",
    city: doc.city ?? "",
    country: doc.country ?? "",
    postalCode: doc.postalCode ?? "",
    isPrimary: Boolean(doc.isPrimary),
  };
}

export function serializePartyContact(doc) {
  return {
    id: subId(doc),
    name: doc.name ?? "",
    email: doc.email ?? "",
    phone: doc.phone ?? "",
    jobTitle: doc.jobTitle ?? "",
    isPrimary: Boolean(doc.isPrimary),
  };
}

export function serializePartyAlias(doc) {
  return {
    id: subId(doc),
    role: doc.role ?? "",
    aliasCode: doc.aliasCode ?? "",
    source: doc.source ?? "",
  };
}

export function serializePartyRelation(doc, relatedParty) {
  return {
    id: subId(doc),
    relatedPartyId: String(doc.relatedPartyId),
    relatedPartyCode: relatedParty?.code ?? "",
    relatedPartyName: relatedParty?.legalName ?? "",
    relationshipType: doc.relationshipType ?? "other",
    primaryRole: doc.primaryRole ?? "",
    clientAlias: doc.clientAlias ?? "",
    notes: doc.notes ?? "",
  };
}

export function serializePartyFacility(doc, facility) {
  return {
    id: subId(doc),
    facilityId: String(doc.facilityId),
    facilityCode: facility?.code ?? "",
    facilityName: facility?.name ?? "",
    facilityType: facility?.facilityType ?? "warehouse",
    city: facility?.city ?? "",
    country: facility?.country ?? "",
    purpose: doc.purpose ?? "operates",
    primaryRole: doc.primaryRole ?? "",
    isPrimary: Boolean(doc.isPrimary),
    notes: doc.notes ?? "",
  };
}

function ensureSinglePrimary(items, field = "isPrimary") {
  let seen = false;
  return items.map((item) => {
    if (!item[field]) return item;
    if (seen) return { ...item, [field]: false };
    seen = true;
    return item;
  });
}

function validateAddressBook(raw, errors) {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    errors.push("addressBook must be an array.");
    return undefined;
  }
  if (raw.length > MAX_NESTED_ITEMS) {
    errors.push(`addressBook supports at most ${MAX_NESTED_ITEMS} entries.`);
    return undefined;
  }

  const items = raw.map((entry, index) => {
    const label = String(entry?.label ?? "registered")
      .trim()
      .toLowerCase();
    const line1 = String(entry?.line1 ?? "").trim();
    if (!line1) errors.push(`addressBook[${index}].line1 is required.`);
    if (!isValidPartyAddressLabel(label)) {
      errors.push(`addressBook[${index}].label is invalid.`);
    }
    return {
      ...(entry?.id && mongoose.isValidObjectId(entry.id) ? { _id: entry.id } : {}),
      label,
      line1: line1.slice(0, 200),
      line2: String(entry?.line2 ?? "")
        .trim()
        .slice(0, 200),
      city: String(entry?.city ?? "")
        .trim()
        .slice(0, 80),
      country: String(entry?.country ?? "")
        .trim()
        .slice(0, 80),
      postalCode: String(entry?.postalCode ?? "")
        .trim()
        .slice(0, 32),
      isPrimary: Boolean(entry?.isPrimary),
    };
  });

  return ensureSinglePrimary(items);
}

function validateContacts(raw, errors) {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    errors.push("contacts must be an array.");
    return undefined;
  }
  if (raw.length > MAX_NESTED_ITEMS) {
    errors.push(`contacts supports at most ${MAX_NESTED_ITEMS} entries.`);
    return undefined;
  }

  const items = raw.map((entry, index) => {
    const name = String(entry?.name ?? "").trim();
    if (!name) errors.push(`contacts[${index}].name is required.`);
    return {
      ...(entry?.id && mongoose.isValidObjectId(entry.id) ? { _id: entry.id } : {}),
      name: name.slice(0, 120),
      email: String(entry?.email ?? "")
        .trim()
        .slice(0, 120),
      phone: String(entry?.phone ?? "")
        .trim()
        .slice(0, 40),
      jobTitle: String(entry?.jobTitle ?? "")
        .trim()
        .slice(0, 80),
      isPrimary: Boolean(entry?.isPrimary),
    };
  });

  return ensureSinglePrimary(items);
}

function validateAliases(raw, errors) {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    errors.push("aliases must be an array.");
    return undefined;
  }
  if (raw.length > MAX_NESTED_ITEMS) {
    errors.push(`aliases supports at most ${MAX_NESTED_ITEMS} entries.`);
    return undefined;
  }

  const seen = new Set();
  const items = raw.map((entry, index) => {
    const role = String(entry?.role ?? "")
      .trim()
      .toLowerCase();
    const aliasCode = normalizePartyClientAlias(entry?.aliasCode);
    if (!role || !isValidPartyRole(role)) {
      errors.push(`aliases[${index}].role is required and must be valid.`);
    }
    if (!aliasCode) errors.push(`aliases[${index}].aliasCode is required.`);
    const key = `${role}:${partyClientAliasLookupKey(aliasCode)}`;
    if (seen.has(key)) errors.push(`aliases[${index}] duplicates role and aliasCode.`);
    seen.add(key);
    return {
      ...(entry?.id && mongoose.isValidObjectId(entry.id) ? { _id: entry.id } : {}),
      role,
      aliasCode,
      source: String(entry?.source ?? "")
        .trim()
        .slice(0, 80),
    };
  });

  return items;
}

function validateRelatedParties(raw, partyId, errors) {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    errors.push("relatedParties must be an array.");
    return undefined;
  }
  if (raw.length > MAX_NESTED_ITEMS) {
    errors.push(`relatedParties supports at most ${MAX_NESTED_ITEMS} entries.`);
    return undefined;
  }

  const seen = new Set();
  const items = raw.map((entry, index) => {
    const relatedPartyId = String(entry?.relatedPartyId ?? "").trim();
    const relationshipType = String(entry?.relationshipType ?? "other")
      .trim()
      .toLowerCase();
    const primaryRole = String(entry?.primaryRole ?? "")
      .trim()
      .toLowerCase();
    if (!mongoose.isValidObjectId(relatedPartyId)) {
      errors.push(`relatedParties[${index}].relatedPartyId is invalid.`);
    } else if (relatedPartyId === String(partyId)) {
      errors.push(`relatedParties[${index}] cannot reference the same party.`);
    }
    if (!isValidRelatedPartyLinkType(relationshipType)) {
      errors.push(`relatedParties[${index}].relationshipType is invalid.`);
    }
    if (primaryRole && !isValidPartyRole(primaryRole)) {
      errors.push(`relatedParties[${index}].primaryRole is invalid.`);
    }
    const clientAlias = normalizePartyClientAlias(entry?.clientAlias ?? "");
    if (clientAlias && clientAlias.length > 80) {
      errors.push(`relatedParties[${index}].clientAlias must be at most 80 characters.`);
    }
    const key = relatedPartyId;
    if (seen.has(key)) errors.push(`relatedParties[${index}] duplicates related party.`);
    seen.add(key);
    return {
      ...(entry?.id && mongoose.isValidObjectId(entry.id) ? { _id: entry.id } : {}),
      relatedPartyId: new mongoose.Types.ObjectId(relatedPartyId),
      relationshipType,
      ...(primaryRole ? { primaryRole } : {}),
      clientAlias,
      notes: String(entry?.notes ?? "")
        .trim()
        .slice(0, 500),
    };
  });

  return items;
}

function validateRelatedFacilities(raw, errors) {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    errors.push("relatedFacilities must be an array.");
    return undefined;
  }
  if (raw.length > MAX_NESTED_ITEMS) {
    errors.push(`relatedFacilities supports at most ${MAX_NESTED_ITEMS} entries.`);
    return undefined;
  }

  const seen = new Set();
  const items = raw.map((entry, index) => {
    const facilityId = String(entry?.facilityId ?? "").trim();
    const purpose = String(entry?.purpose ?? "operates")
      .trim()
      .toLowerCase();
    const primaryRole = String(entry?.primaryRole ?? "")
      .trim()
      .toLowerCase();
    if (!mongoose.isValidObjectId(facilityId)) {
      errors.push(`relatedFacilities[${index}].facilityId is invalid.`);
    }
    if (!isValidPartyFacilityPurpose(purpose)) {
      errors.push(`relatedFacilities[${index}].purpose is invalid.`);
    }
    if (primaryRole && !isValidPartyRole(primaryRole)) {
      errors.push(`relatedFacilities[${index}].primaryRole is invalid.`);
    }
    if (seen.has(facilityId)) errors.push(`relatedFacilities[${index}] duplicates facility.`);
    seen.add(facilityId);
    return {
      ...(entry?.id && mongoose.isValidObjectId(entry.id) ? { _id: entry.id } : {}),
      facilityId: new mongoose.Types.ObjectId(facilityId),
      purpose,
      ...(primaryRole ? { primaryRole } : {}),
      isPrimary: false,
      notes: String(entry?.notes ?? "")
        .trim()
        .slice(0, 500),
    };
  });

  return items;
}

export function validatePartyNestedInput(body, { partyId, partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body?.addressBook !== undefined) {
    const addressBook = validateAddressBook(body?.addressBook, errors);
    if (addressBook !== undefined) data.addressBook = addressBook;
  }
  if (!partial || body?.contacts !== undefined) {
    const contacts = validateContacts(body?.contacts, errors);
    if (contacts !== undefined) data.contacts = contacts;
  }
  if (!partial || body?.aliases !== undefined) {
    const aliases = validateAliases(body?.aliases, errors);
    if (aliases !== undefined) data.aliases = aliases;
  }
  if (!partial || body?.relatedParties !== undefined) {
    const relatedParties = validateRelatedParties(body?.relatedParties, partyId, errors);
    if (relatedParties !== undefined) data.relatedParties = relatedParties;
  }
  if (!partial || body?.relatedFacilities !== undefined) {
    const relatedFacilities = validateRelatedFacilities(body?.relatedFacilities, errors);
    if (relatedFacilities !== undefined) data.relatedFacilities = relatedFacilities;
  }

  return { errors, data };
}

export async function assertRelatedPartiesExist(companyId, relatedParties, errors) {
  if (!relatedParties?.length) return;
  const ids = relatedParties.map((r) => r.relatedPartyId);
  const { Party } = await import("../../models/Party.js");
  const found = await Party.find({ companyId, _id: { $in: ids } })
    .select("_id")
    .lean();
  if (found.length !== ids.length) {
    errors.push("One or more related parties were not found.");
  }
}

export async function assertRelatedFacilitiesExist(companyId, relatedFacilities, errors) {
  if (!relatedFacilities?.length) return;
  const ids = relatedFacilities.map((r) => r.facilityId);
  const { Facility } = await import("../../models/Facility.js");
  const found = await Facility.find({ companyId, _id: { $in: ids } })
    .select("_id")
    .lean();
  if (found.length !== ids.length) {
    errors.push("One or more related facilities were not found.");
  }
}
