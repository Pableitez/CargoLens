import mongoose from "mongoose";
import { normalizeBeCode } from "../../../../shared/domain/beCode.js";
import { normalizeFacilityCode } from "../../../../shared/domain/facilityCode.js";
import {
  isValidFacilityType,
  isValidPartyFacilityPurpose,
  isValidRelatedPartyLinkType,
  normalizePartyClientAlias,
  normalizeTradeCode,
} from "../../../../shared/domain/tradeMasters.js";
import { Facility } from "../../models/Facility.js";
import { Party } from "../../models/Party.js";
import { pickCell, rowsFromNamedSheet } from "../../utils/spreadsheet.js";
import { validateFacilityInput } from "./facilityValidation.js";
import { validatePartyInput } from "./partyValidation.js";
import { TRADE_MASTERS_IMPORT_KINDS } from "./tradeMastersImportKinds.js";

const PREVIEW_LIMIT = 50;
const ERROR_LIMIT = 25;

function rowNumber(index) {
  return index + 2;
}

function previewSlice(rows) {
  return {
    rowsTotal: rows.length,
    valid: rows.filter((r) => r.valid).length,
    invalid: rows.filter((r) => !r.valid).length,
    preview: rows.slice(0, PREVIEW_LIMIT).map((r) => ({
      rowNumber: r.rowNumber,
      label: r.action ? `${r.label} (${r.action})` : r.label,
      errors: r.errors,
      valid: r.valid,
      action: r.action,
    })),
    errors: rows
      .filter((r) => !r.valid)
      .flatMap((r) => r.errors)
      .slice(0, ERROR_LIMIT),
  };
}

function parsePartyRow(row, index) {
  const code = normalizeBeCode(pickCell(row, "be_code", "be code", "alias", "code"));
  const legalName = pickCell(row, "party", "legal_name", "legal name", "name");
  const errors = [];
  const rowNum = rowNumber(index);

  if (!code) errors.push(`Row ${rowNum}: be_code is required`);
  if (!legalName) errors.push(`Row ${rowNum}: party is required`);

  const payload = {
    code,
    legalName,
    country: pickCell(row, "country"),
    city: pickCell(row, "city"),
    address: pickCell(row, "address", "address_line1", "line1"),
    vat: pickCell(row, "vat", "vat_number", "vat number", "nif"),
    notes: pickCell(row, "notes"),
  };

  const { errors: valErrors } = validatePartyInput(payload);
  errors.push(...valErrors.map((e) => `Row ${rowNum}: ${e}`));

  return {
    rowNumber: rowNum,
    label: code || `(row ${rowNum})`,
    code,
    payload,
    errors,
    valid: errors.length === 0,
  };
}

function parseFacilityRow(row, index) {
  const code = normalizeFacilityCode(pickCell(row, "code"));
  const name = pickCell(row, "name");
  const rawType = pickCell(row, "facility_type", "facility type", "type");
  const errors = [];
  const rowNum = rowNumber(index);

  if (!code) errors.push(`Row ${rowNum}: code is required`);
  if (!name) errors.push(`Row ${rowNum}: name is required`);
  if (rawType === "port") {
    errors.push(`Row ${rowNum}: ports are created from the UN/LOCODE catalog — omit port rows here`);
  } else if (rawType && !isValidFacilityType(rawType)) {
    errors.push(`Row ${rowNum}: facility_type is invalid`);
  }

  const payload = {
    code,
    name,
    ...(rawType && rawType !== "port" ? { facilityType: rawType.toLowerCase() } : {}),
    line1: pickCell(row, "line1", "address", "address_line1"),
    city: pickCell(row, "city"),
    country: pickCell(row, "country"),
    postalCode: pickCell(row, "postal_code", "postal code"),
    notes: pickCell(row, "notes"),
    line2: "",
    locationCode: "",
  };

  const { errors: valErrors } = validateFacilityInput(payload);
  errors.push(...valErrors.map((e) => `Row ${rowNum}: ${e}`));

  return {
    rowNumber: rowNum,
    label: code || `(row ${rowNum})`,
    code,
    payload,
    errors,
    valid: errors.length === 0,
  };
}

function parseRelatedPartyRow(row, index) {
  const partyCode = normalizeTradeCode(
    pickCell(row, "party_be_code", "party be code", "party_alias", "party code", "party_code")
  );
  const relatedCode = normalizeTradeCode(
    pickCell(
      row,
      "related_party_be_code",
      "related party be code",
      "related_party_alias",
      "related party code",
      "related_party_code",
      "related_code"
    )
  );
  const relationshipType = pickCell(row, "relationship_type", "relationship type", "role") || "other";
  const clientAlias = normalizePartyClientAlias(
    pickCell(row, "client_alias", "client alias", "client_name", "client name")
  );
  const errors = [];
  const rowNum = rowNumber(index);

  if (!partyCode) errors.push(`Row ${rowNum}: party_be_code is required`);
  if (!relatedCode) errors.push(`Row ${rowNum}: related_party_be_code is required`);
  if (partyCode && relatedCode && partyCode === relatedCode) {
    errors.push(`Row ${rowNum}: party cannot link to itself`);
  }
  if (!isValidRelatedPartyLinkType(relationshipType)) {
    errors.push(`Row ${rowNum}: relationship_type is invalid`);
  }

  return {
    rowNumber: rowNum,
    label: partyCode && relatedCode ? `${partyCode} → ${relatedCode}` : `(row ${rowNum})`,
    partyCode,
    relatedCode,
    relationshipType: relationshipType.toLowerCase(),
    clientAlias,
    notes: pickCell(row, "notes"),
    errors,
    valid: errors.length === 0,
  };
}

function parseRelatedFacilityRow(row, index) {
  const partyCode = normalizeTradeCode(
    pickCell(row, "party_be_code", "party be code", "party_alias", "party code", "party_code")
  );
  const facilityCode = normalizeTradeCode(pickCell(row, "facility_code", "facility code"));
  const purpose = pickCell(row, "purpose") || "operates";
  const errors = [];
  const rowNum = rowNumber(index);

  if (!partyCode) errors.push(`Row ${rowNum}: party_be_code is required`);
  if (!facilityCode) errors.push(`Row ${rowNum}: facility_code is required`);
  if (!isValidPartyFacilityPurpose(purpose)) {
    errors.push(`Row ${rowNum}: purpose is invalid`);
  }

  return {
    rowNumber: rowNum,
    label: partyCode && facilityCode ? `${partyCode} → ${facilityCode}` : `(row ${rowNum})`,
    partyCode,
    facilityCode,
    purpose: purpose.toLowerCase(),
    notes: pickCell(row, "notes"),
    errors,
    valid: errors.length === 0,
  };
}

function nonEmptyRows(rows) {
  return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));
}

export function parseTradeMastersWorkbook(workbook) {
  const partiesSheet = rowsFromNamedSheet(workbook, "parties");
  const facilitiesSheet = rowsFromNamedSheet(workbook, "facilities");
  const relatedPartiesSheet = rowsFromNamedSheet(workbook, "related_parties");
  const relatedFacilitiesSheet = rowsFromNamedSheet(workbook, "related_facilities");

  const parties = nonEmptyRows(partiesSheet.rows).map(parsePartyRow);
  const facilities = nonEmptyRows(facilitiesSheet.rows).map(parseFacilityRow);
  const relatedParties = nonEmptyRows(relatedPartiesSheet.rows).map(parseRelatedPartyRow);
  const relatedFacilities = nonEmptyRows(relatedFacilitiesSheet.rows).map(parseRelatedFacilityRow);

  const hasAnySheet =
    partiesSheet.found || facilitiesSheet.found || relatedPartiesSheet.found || relatedFacilitiesSheet.found;

  return {
    hasAnySheet,
    parties,
    facilities,
    relatedParties,
    relatedFacilities,
  };
}

export async function previewTradeMastersImport(workbook, companyId) {
  const parsed = parseTradeMastersWorkbook(workbook);
  if (!parsed.hasAnySheet) {
    return {
      ok: false,
      error:
        "No recognized sheets found. Use the template (parties, facilities, related_parties, related_facilities).",
    };
  }

  const companyOid = new mongoose.Types.ObjectId(companyId);
  const stagedPartyCodes = parsed.parties.filter((row) => row.valid).map((row) => row.code);
  const stagedFacilityCodes = parsed.facilities.filter((row) => row.valid).map((row) => row.code);

  await enrichPartyRows(parsed.parties, companyOid);
  await enrichFacilityRows(parsed.facilities, companyOid);
  await validateRelatedPartyRows(parsed.relatedParties, companyOid, stagedPartyCodes);
  await validateRelatedFacilityRows(
    parsed.relatedFacilities,
    companyOid,
    stagedPartyCodes,
    stagedFacilityCodes
  );

  const sheets = {
    parties: previewSlice(parsed.parties),
    facilities: previewSlice(parsed.facilities),
    related_parties: previewSlice(parsed.relatedParties),
    related_facilities: previewSlice(parsed.relatedFacilities),
  };

  const valid =
    sheets.parties.valid +
    sheets.facilities.valid +
    sheets.related_parties.valid +
    sheets.related_facilities.valid;
  const rowsTotal =
    sheets.parties.rowsTotal +
    sheets.facilities.rowsTotal +
    sheets.related_parties.rowsTotal +
    sheets.related_facilities.rowsTotal;

  return {
    ok: true,
    rowsTotal,
    valid,
    invalid: rowsTotal - valid,
    sheets,
  };
}

export async function importTradeMastersWorkbook(workbook, companyId) {
  const parsed = parseTradeMastersWorkbook(workbook);
  if (!parsed.hasAnySheet) {
    return {
      ok: false,
      error:
        "No recognized sheets found. Use the template (parties, facilities, related_parties, related_facilities).",
    };
  }

  const companyOid = new mongoose.Types.ObjectId(companyId);
  const parties = { created: 0, updated: 0, skipped: 0, errors: [] };
  const facilities = { created: 0, updated: 0, skipped: 0, errors: [] };
  const related_parties = { linked: 0, updated: 0, skipped: 0, errors: [] };
  const related_facilities = { linked: 0, updated: 0, skipped: 0, errors: [] };

  await importPartyRows(parsed.parties, companyId, companyOid, parties);
  await importFacilityRows(parsed.facilities, companyId, companyOid, facilities);
  await importRelatedPartyRows(parsed.relatedParties, companyOid, related_parties);
  await importRelatedFacilityRows(parsed.relatedFacilities, companyOid, related_facilities);

  return { ok: true, parties, facilities, related_parties, related_facilities };
}

const ROW_PARSERS = {
  parties: parsePartyRow,
  facilities: parseFacilityRow,
  related_parties: parseRelatedPartyRow,
  related_facilities: parseRelatedFacilityRow,
};

export function parseTradeMastersWorkbookByKind(workbook, kind) {
  const sheet = rowsFromNamedSheet(workbook, kind);
  const parseRow = ROW_PARSERS[kind];
  const rows = nonEmptyRows(sheet.rows).map(parseRow);
  return { found: sheet.found, rows };
}

async function enrichPartyRows(rows, companyOid) {
  const partyCodes = new Set(
    (await Party.find({ companyId: companyOid }).select("code").lean()).map((p) => normalizeTradeCode(p.code))
  );
  for (const row of rows) {
    if (!row.valid) continue;
    row.action = partyCodes.has(row.code) ? "update" : "create";
  }
  return partyCodes;
}

async function enrichFacilityRows(rows, companyOid) {
  const facilityCodes = new Set(
    (await Facility.find({ companyId: companyOid }).select("code").lean()).map((f) =>
      normalizeTradeCode(f.code)
    )
  );
  for (const row of rows) {
    if (!row.valid) continue;
    row.action = facilityCodes.has(row.code) ? "update" : "create";
  }
  return facilityCodes;
}

async function validateRelatedPartyRows(rows, companyOid, stagedPartyCodes = []) {
  const partyCodes = new Set(
    (await Party.find({ companyId: companyOid }).select("code").lean()).map((p) => normalizeTradeCode(p.code))
  );
  for (const row of rows) {
    if (!row.valid) continue;
    if (!partyCodes.has(row.partyCode) && !stagedPartyCodes.includes(row.partyCode)) {
      row.errors.push(`Row ${row.rowNumber}: party_be_code ${row.partyCode} not found`);
      row.valid = false;
    }
    if (!partyCodes.has(row.relatedCode) && !stagedPartyCodes.includes(row.relatedCode)) {
      row.errors.push(`Row ${row.rowNumber}: related_party_be_code ${row.relatedCode} not found`);
      row.valid = false;
    }
  }
}

async function validateRelatedFacilityRows(
  rows,
  companyOid,
  stagedPartyCodes = [],
  stagedFacilityCodes = []
) {
  const partyCodes = new Set(
    (await Party.find({ companyId: companyOid }).select("code").lean()).map((p) => normalizeTradeCode(p.code))
  );
  const facilityCodes = new Set(
    (await Facility.find({ companyId: companyOid }).select("code").lean()).map((f) =>
      normalizeTradeCode(f.code)
    )
  );
  for (const row of rows) {
    if (!row.valid) continue;
    if (!partyCodes.has(row.partyCode) && !stagedPartyCodes.includes(row.partyCode)) {
      row.errors.push(`Row ${row.rowNumber}: party_be_code ${row.partyCode} not found`);
      row.valid = false;
    }
    if (!facilityCodes.has(row.facilityCode) && !stagedFacilityCodes.includes(row.facilityCode)) {
      row.errors.push(`Row ${row.rowNumber}: facility_code ${row.facilityCode} not found`);
      row.valid = false;
    }
  }
}

function kindSheetMissingError(kind) {
  return `No "${kind}" sheet found. Download the template for this import type and keep the sheet name unchanged.`;
}

export async function previewTradeMastersImportByKind(workbook, companyId, kind) {
  const { found, rows } = parseTradeMastersWorkbookByKind(workbook, kind);
  if (!found && rows.length === 0) {
    return { ok: false, error: kindSheetMissingError(kind) };
  }

  const companyOid = new mongoose.Types.ObjectId(companyId);

  if (kind === "parties") {
    await enrichPartyRows(rows, companyOid);
  } else if (kind === "facilities") {
    await enrichFacilityRows(rows, companyOid);
  } else if (kind === "related_parties") {
    await validateRelatedPartyRows(rows, companyOid);
  } else if (kind === "related_facilities") {
    await validateRelatedFacilityRows(rows, companyOid);
  }

  const sheet = previewSlice(rows);
  return {
    ok: true,
    kind,
    rowsTotal: sheet.rowsTotal,
    valid: sheet.valid,
    invalid: sheet.invalid,
    preview: sheet.preview,
    errors: sheet.errors,
  };
}

async function importPartyRows(rows, companyId, companyOid, result) {
  for (const row of rows) {
    if (!row.valid) {
      result.errors.push(...row.errors);
      continue;
    }
    try {
      const existing = await Party.findOne({ companyId: companyOid, code: row.code });
      if (existing) {
        if ((existing.accountTier ?? "operational") === "contractual") {
          result.skipped += 1;
          continue;
        }
        await Party.updateOne({ _id: existing._id }, { $set: row.payload });
        result.updated += 1;
      } else {
        await Party.create({ companyId, accountTier: "operational", ...row.payload });
        result.created += 1;
      }
    } catch (err) {
      result.errors.push(`Row ${row.rowNumber}: ${err?.message ?? "Could not save party"}`);
    }
  }
}

async function importFacilityRows(rows, companyId, companyOid, result) {
  for (const row of rows) {
    if (!row.valid) {
      result.errors.push(...row.errors);
      continue;
    }
    try {
      const existing = await Facility.findOne({ companyId: companyOid, code: row.code });
      if (existing) {
        if (existing.catalogSource === "unloc") {
          result.skipped += 1;
          continue;
        }
        await Facility.updateOne({ _id: existing._id }, { $set: row.payload });
        result.updated += 1;
      } else {
        await Facility.create({ companyId, catalogSource: "manual", ...row.payload });
        result.created += 1;
      }
    } catch (err) {
      result.errors.push(`Row ${row.rowNumber}: ${err?.message ?? "Could not save facility"}`);
    }
  }
}

async function importRelatedPartyRows(rows, companyOid, result) {
  const partyByCode = new Map(
    (await Party.find({ companyId: companyOid }).select("code relatedParties").lean()).map((p) => [
      normalizeTradeCode(p.code),
      p,
    ])
  );

  const linksByParty = new Map();
  for (const row of rows) {
    if (!row.valid) {
      result.errors.push(...row.errors);
      continue;
    }
    const bucket = linksByParty.get(row.partyCode) ?? [];
    bucket.push(row);
    linksByParty.set(row.partyCode, bucket);
  }

  for (const [partyCode, linkRows] of linksByParty) {
    const partyDoc = partyByCode.get(partyCode);
    if (!partyDoc) {
      for (const row of linkRows) {
        result.errors.push(`Row ${row.rowNumber}: party_be_code ${partyCode} not found`);
      }
      continue;
    }

    const relatedParties = [...(partyDoc.relatedParties ?? [])];
    for (const row of linkRows) {
      const related = partyByCode.get(row.relatedCode);
      if (!related) {
        result.errors.push(`Row ${row.rowNumber}: related_party_be_code ${row.relatedCode} not found`);
        continue;
      }
      const relatedId = String(related._id);
      const existingIdx = relatedParties.findIndex((r) => String(r.relatedPartyId) === relatedId);
      if (existingIdx >= 0) {
        relatedParties[existingIdx].relationshipType = row.relationshipType;
        relatedParties[existingIdx].clientAlias = row.clientAlias ?? "";
        relatedParties[existingIdx].notes = row.notes;
        result.updated += 1;
      } else {
        relatedParties.push({
          relatedPartyId: related._id,
          relationshipType: row.relationshipType,
          clientAlias: row.clientAlias ?? "",
          notes: row.notes,
        });
        result.linked += 1;
      }
    }

    await Party.updateOne({ _id: partyDoc._id }, { $set: { relatedParties } });
    partyDoc.relatedParties = relatedParties;
  }
}

async function importRelatedFacilityRows(rows, companyOid, result) {
  const partyByCode = new Map(
    (await Party.find({ companyId: companyOid }).select("code").lean()).map((p) => [
      normalizeTradeCode(p.code),
      p,
    ])
  );
  const facilityByCode = new Map(
    (await Facility.find({ companyId: companyOid }).select("code").lean()).map((f) => [
      normalizeTradeCode(f.code),
      f,
    ])
  );

  const facLinksByParty = new Map();
  for (const row of rows) {
    if (!row.valid) {
      result.errors.push(...row.errors);
      continue;
    }
    const bucket = facLinksByParty.get(row.partyCode) ?? [];
    bucket.push(row);
    facLinksByParty.set(row.partyCode, bucket);
  }

  for (const [partyCode, linkRows] of facLinksByParty) {
    const partyDoc = partyByCode.get(partyCode);
    if (!partyDoc) {
      for (const row of linkRows) {
        result.errors.push(`Row ${row.rowNumber}: party_be_code ${partyCode} not found`);
      }
      continue;
    }

    const fresh = await Party.findById(partyDoc._id).select("relatedFacilities").lean();
    const relatedFacilities = [...(fresh?.relatedFacilities ?? [])];

    for (const row of linkRows) {
      const facility = facilityByCode.get(row.facilityCode);
      if (!facility) {
        result.errors.push(`Row ${row.rowNumber}: facility_code ${row.facilityCode} not found`);
        continue;
      }
      const facilityId = String(facility._id);
      const existingIdx = relatedFacilities.findIndex((r) => String(r.facilityId) === facilityId);
      if (existingIdx >= 0) {
        relatedFacilities[existingIdx].purpose = row.purpose;
        relatedFacilities[existingIdx].notes = row.notes;
        result.updated += 1;
      } else {
        relatedFacilities.push({
          facilityId: facility._id,
          purpose: row.purpose,
          isPrimary: false,
          notes: row.notes,
        });
        result.linked += 1;
      }
    }

    await Party.updateOne({ _id: partyDoc._id }, { $set: { relatedFacilities } });
  }
}

export async function importTradeMastersWorkbookByKind(workbook, companyId, kind) {
  const { found, rows } = parseTradeMastersWorkbookByKind(workbook, kind);
  if (!found && rows.length === 0) {
    return { ok: false, error: kindSheetMissingError(kind) };
  }

  const companyOid = new mongoose.Types.ObjectId(companyId);

  if (kind === "related_parties") {
    await validateRelatedPartyRows(rows, companyOid);
  } else if (kind === "related_facilities") {
    await validateRelatedFacilityRows(rows, companyOid);
  }

  if (kind === "parties") {
    const result = { kind, created: 0, updated: 0, skipped: 0, errors: [] };
    await importPartyRows(rows, companyId, companyOid, result);
    return { ok: true, ...result };
  }

  if (kind === "facilities") {
    const result = { kind, created: 0, updated: 0, skipped: 0, errors: [] };
    await importFacilityRows(rows, companyId, companyOid, result);
    return { ok: true, ...result };
  }

  if (kind === "related_parties") {
    const result = { kind, linked: 0, updated: 0, skipped: 0, errors: [] };
    await importRelatedPartyRows(rows, companyOid, result);
    return { ok: true, ...result };
  }

  if (kind === "related_facilities") {
    const result = { kind, linked: 0, updated: 0, skipped: 0, errors: [] };
    await importRelatedFacilityRows(rows, companyOid, result);
    return { ok: true, ...result };
  }

  return { ok: false, error: "Unsupported import kind." };
}

export { TRADE_MASTERS_IMPORT_KINDS };
