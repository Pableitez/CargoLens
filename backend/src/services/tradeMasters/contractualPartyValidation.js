import mongoose from "mongoose";
import { normalizeBeCode } from "../../../../shared/domain/beCode.js";
import { normalizePartyVat } from "../../../../shared/domain/partyVat.js";
import { isValidContractualTier } from "../../../../shared/domain/tradeMasters.js";
import { Party } from "../../models/Party.js";

export function isContractualParty(doc) {
  return (doc?.accountTier ?? "operational") === "contractual";
}

export function serializeContractualParty(doc, { parentName = null, savedContainerCount = 0 } = {}) {
  return {
    id: doc._id,
    name: doc.legalName ?? "",
    code: doc.code ?? "",
    contractualTier: doc.contractualTier ?? "primary",
    parentClientId: doc.parentPartyId ?? null,
    parentClientName: parentName,
    parentPartyId: doc.parentPartyId ?? null,
    inviteCode: doc.inviteCode ?? "",
    accountTier: doc.accountTier ?? "contractual",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    savedContainerCount,
  };
}

/** @deprecated alias */
export const serializeClient = serializeContractualParty;

export async function resolvePrimaryContractualParty(party) {
  if (!party || !isContractualParty(party)) return null;
  const tier = party.contractualTier ?? "primary";
  if (tier === "primary" || !party.parentPartyId) return party;
  return Party.findOne({
    _id: party.parentPartyId,
    accountTier: "contractual",
  }).lean();
}

/** @deprecated alias */
export const resolvePrimaryClient = resolvePrimaryContractualParty;

export async function findContractualPartyById(companyId, partyId) {
  return Party.findOne({
    _id: partyId,
    companyId: new mongoose.Types.ObjectId(companyId),
    accountTier: "contractual",
  }).lean();
}

export async function findContractualPartyByCode(companyId, code) {
  const normalized = normalizeBeCode(code);
  if (!normalized) return null;
  return Party.findOne({
    companyId: new mongoose.Types.ObjectId(companyId),
    accountTier: "contractual",
    code: normalized,
  }).lean();
}

export async function validateContractualPartyInput(body, companyId, { partial = false, existing } = {}) {
  const errors = [];
  const data = {};
  const companyOid = new mongoose.Types.ObjectId(companyId);

  if (!partial || body?.name !== undefined || body?.legalName !== undefined) {
    const legalName = String(body?.legalName ?? body?.name ?? "").trim();
    if (!legalName) errors.push("Client name is required");
    else data.legalName = legalName.slice(0, 200);
  }

  if (body?.code !== undefined) {
    const code = normalizeBeCode(body.code);
    if (!code) errors.push("Contractual code cannot be empty");
    else {
      const codeError = beCodeValidationError(code);
      if (codeError) errors.push(codeError);
      else data.code = code;
    }
  }

  let tier = existing?.contractualTier ?? "primary";
  if (body?.contractualTier !== undefined) {
    tier = String(body.contractualTier ?? "")
      .trim()
      .toLowerCase();
    if (!isValidContractualTier(tier)) {
      errors.push("contractualTier must be primary or subsidiary");
    } else {
      data.contractualTier = tier;
    }
  }

  let parentPartyId = existing?.parentPartyId ?? null;
  if (body?.parentClientId !== undefined || body?.parentPartyId !== undefined) {
    const raw = String(body?.parentPartyId ?? body?.parentClientId ?? "").trim();
    parentPartyId = raw && mongoose.isValidObjectId(raw) ? new mongoose.Types.ObjectId(raw) : null;
    data.parentPartyId = parentPartyId;
  }

  if (tier === "subsidiary") {
    if (!parentPartyId) {
      errors.push("parentPartyId is required for subsidiary contractuales");
    } else if (existing && String(parentPartyId) === String(existing._id)) {
      errors.push("A party cannot be its own parent");
    } else if (errors.length === 0) {
      const parent = await Party.findOne({
        _id: parentPartyId,
        companyId: companyOid,
        accountTier: "contractual",
      }).lean();
      if (!parent) {
        errors.push("parentPartyId must reference an existing primary client party in this company");
      } else if ((parent.contractualTier ?? "primary") !== "primary") {
        errors.push("parentPartyId must reference a primary client party");
      }
    }
  } else if (tier === "primary" && parentPartyId) {
    errors.push("primary client parties cannot have a parentPartyId");
  } else if (tier === "primary") {
    data.parentPartyId = null;
  }

  if (!partial || body?.vat !== undefined) {
    const vat = normalizePartyVat(body?.vat);
    if (!partial && !vat) errors.push("vat is required.");
    data.vat = vat;
  }

  data.accountTier = "contractual";

  return { errors, data };
}

/** @deprecated alias */
export const validateClientInput = validateContractualPartyInput;
