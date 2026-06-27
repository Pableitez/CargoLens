import { beCodeValidationError, normalizeBeCode } from "../../../../shared/domain/beCode.js";
import { normalizePartyVat } from "../../../../shared/domain/partyVat.js";

import {
  serializePartyAddress,
  serializePartyAlias,
  serializePartyContact,
  serializePartyRelation,
} from "./partyNestedValidation.js";

export function serializeParty(doc) {
  const base = {
    id: doc._id,
    code: doc.code,
    legalName: doc.legalName,
    country: doc.country ?? "",
    city: doc.city ?? "",
    address: doc.address ?? "",
    vat: doc.vat ?? "",
    notes: doc.notes ?? "",
    accountTier: doc.accountTier ?? "operational",
    contractualTier: doc.contractualTier ?? "primary",
    parentPartyId: doc.parentPartyId ? String(doc.parentPartyId) : null,
    inviteCode: doc.inviteCode ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (doc.addressBook !== undefined) {
    base.addressBook = (doc.addressBook ?? []).map(serializePartyAddress);
  }
  if (doc.contacts !== undefined) {
    base.contacts = (doc.contacts ?? []).map(serializePartyContact);
  }
  if (doc.aliases !== undefined) {
    base.aliases = (doc.aliases ?? []).map(serializePartyAlias);
  }
  if (doc.relatedParties !== undefined) {
    base.relatedParties = (doc.relatedParties ?? []).map((row) => serializePartyRelation(row));
  }

  return base;
}

export function validatePartyInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body?.code !== undefined) {
    const code = normalizeBeCode(body?.code);
    const codeError = beCodeValidationError(code);
    if (codeError) errors.push(codeError);
    else data.code = code;
  }

  if (!partial || body?.legalName !== undefined) {
    const legalName = String(body?.legalName ?? "").trim();
    if (!legalName) errors.push("legalName is required");
    else data.legalName = legalName.slice(0, 200);
  }

  if (body?.country !== undefined) {
    data.country = String(body.country ?? "")
      .trim()
      .slice(0, 80);
  }
  if (body?.city !== undefined) {
    data.city = String(body.city ?? "")
      .trim()
      .slice(0, 80);
  }
  if (body?.address !== undefined) {
    data.address = String(body.address ?? "")
      .trim()
      .slice(0, 500);
  }
  if (!partial || body?.vat !== undefined) {
    const vat = normalizePartyVat(body?.vat);
    if (!partial && !vat) errors.push("vat is required.");
    data.vat = vat;
  }
  if (body?.notes !== undefined) {
    data.notes = String(body.notes ?? "")
      .trim()
      .slice(0, 2000);
  }

  return { errors, data };
}
