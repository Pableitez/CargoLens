import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Party } from "../models/Party.js";
import { SupplyChain } from "../models/SupplyChain.js";
import { resolvePartyAccountTierPatch } from "../services/tradeMasters/partyAccountTier.js";
import { mutatePartySubsidiaries } from "../services/tradeMasters/partySubsidiaries.js";
import { buildPartyProfile } from "../services/tradeMasters/partyProfile.js";
import {
  assertRelatedFacilitiesExist,
  assertRelatedPartiesExist,
  validatePartyNestedInput,
} from "../services/tradeMasters/partyNestedValidation.js";
import { serializeParty, validatePartyInput } from "../services/tradeMasters/partyValidation.js";
import {
  canAccessParty,
  getTradeAccess,
  partyIdsForClient,
  portalClientObjectId,
} from "../services/tradeMasters/tradeScope.js";
import { devError } from "../utils/devLog.js";
import { buildTextSearchFilter, mergeFilters } from "../utils/textSearch.js";
import { paginatedFind, parseListQuery } from "../utils/listQuery.js";
import { companyObjectId, dbUnavailable } from "./controllerHelpers.js";

const MAX_BULK_ITEMS = 200;

export async function listParties(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { portalClientId, isClientPortal } = getTradeAccess(req);
  try {
    const companyOid = companyObjectId(req.user.companyId);
    const { limit, skip } = parseListQuery(req.query);
    const q = String(req.query.q ?? "").trim();
    const field = String(req.query.field ?? "").trim();
    const partyFields = ["code", "legalName", "country", "city", "address"];
    const textFilter =
      q && field && partyFields.includes(field)
        ? buildTextSearchFilter(q, [field])
        : buildTextSearchFilter(q, partyFields);

    const scopeParts = [{ companyId: companyOid }];
    if (isClientPortal) {
      const portalOid = portalClientObjectId(portalClientId);
      const or = [{ _id: portalOid }];
      const inChainIds = await partyIdsForClient(req.user.companyId, portalClientId);
      if (inChainIds.length > 0) {
        or.push({ _id: { $in: inChainIds.map((id) => new mongoose.Types.ObjectId(id)) } });
      }
      scopeParts.push({ $or: or });
    }

    const filter = mergeFilters(...scopeParts, textFilter);

    const result = await paginatedFind(Party, filter, {
      sort: { code: 1 },
      limit,
      skip,
      serialize: serializeParty,
    });
    return res.json(result);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list parties." });
  }
}

export async function getParty(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid party id." });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const { portalClientId } = getTradeAccess(req);
    const existing = await Party.findOne({ _id: id, companyId: companyOid });
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Party not found." });
    }
    if (!(await canAccessParty(existing, req.user.companyId, portalClientId))) {
      return res.status(403).json({ error: "FORBIDDEN", message: "You cannot view this party." });
    }

    const profile = await buildPartyProfile(existing);
    return res.json({ item: profile });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load party profile." });
  }
}

export async function createParty(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { errors, data } = validatePartyInput(req.body);
  const nested = validatePartyNestedInput(req.body, { partial: true });
  errors.push(...nested.errors);
  Object.assign(data, nested.data);

  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const payload = { companyId: req.user.companyId, ...data };
    const { isClientPortal } = getTradeAccess(req);

    if (data.relatedParties?.length) {
      const relErrors = [];
      await assertRelatedPartiesExist(companyOid, data.relatedParties, relErrors);
      if (relErrors.length > 0) {
        return res.status(400).json({ error: "INVALID_INPUT", message: relErrors.join(" ") });
      }
    }

    if (data.relatedFacilities?.length) {
      const facErrors = [];
      await assertRelatedFacilitiesExist(companyOid, data.relatedFacilities, facErrors);
      if (facErrors.length > 0) {
        return res.status(400).json({ error: "INVALID_INPUT", message: facErrors.join(" ") });
      }
    }

    const doc = await Party.create(payload);
    const profile = await buildPartyProfile(doc);
    return res.status(201).json({ item: profile });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "DUPLICATE", message: "Alias already exists." });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create party." });
  }
}

export async function createPartiesBulk(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const rawItems = req.body?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "items array is required." });
  }
  if (rawItems.length > MAX_BULK_ITEMS) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: `At most ${MAX_BULK_ITEMS} parties per request.`,
    });
  }

  const items = [];
  const errors = [];

  for (let index = 0; index < rawItems.length; index += 1) {
    const { errors: rowErrors, data } = validatePartyInput(rawItems[index]);
    if (rowErrors.length > 0) {
      errors.push({ index, message: rowErrors.join(" ") });
      continue;
    }
    try {
      const doc = await Party.create({ companyId: req.user.companyId, ...data });
      const profile = await buildPartyProfile(doc);
      items.push(profile);
    } catch (err) {
      if (err?.code === 11000) {
        errors.push({ index, message: "Alias already exists." });
      } else {
        devError(err);
        errors.push({ index, message: "Could not create party." });
      }
    }
  }

  if (items.length === 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "No parties were created.", errors });
  }
  return res.status(201).json({ items, errors });
}

export async function updateParty(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid party id." });
  }

  const { errors, data } = validatePartyInput(req.body, { partial: true });
  const nested = validatePartyNestedInput(req.body, { partyId: id, partial: true });
  errors.push(...nested.errors);
  Object.assign(data, nested.data);

  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const { isClientPortal, portalClientId } = getTradeAccess(req);
    const existing = await Party.findOne({ _id: id, companyId: companyOid });
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Party not found." });
    }
    if (isClientPortal && !(await canAccessParty(existing, req.user.companyId, portalClientId))) {
      return res.status(403).json({ error: "FORBIDDEN", message: "You cannot edit this party." });
    }

    const accountTierTouched =
      req.body?.accountTier !== undefined ||
      req.body?.contractualTier !== undefined ||
      req.body?.parentPartyId !== undefined ||
      req.body?.parentClientId !== undefined;

    if (accountTierTouched) {
      if (isClientPortal) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: "You cannot change the account type from the client portal.",
        });
      }
      const { errors: tierErrors, data: tierData } = await resolvePartyAccountTierPatch(
        req.body,
        existing,
        req.user.companyId
      );
      errors.push(...tierErrors);
      Object.assign(data, tierData);
    }

    const addSubsidiaryPartyIds = Array.isArray(req.body?.addSubsidiaryPartyIds)
      ? req.body.addSubsidiaryPartyIds
      : null;
    const removeSubsidiaryPartyIds = Array.isArray(req.body?.removeSubsidiaryPartyIds)
      ? req.body.removeSubsidiaryPartyIds
      : null;

    if (addSubsidiaryPartyIds !== null || removeSubsidiaryPartyIds !== null) {
      if (isClientPortal) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: "You cannot manage subsidiaries from the client portal.",
        });
      }
      const { errors: subErrors } = await mutatePartySubsidiaries(
        existing,
        {
          addIds: addSubsidiaryPartyIds ?? [],
          removeIds: removeSubsidiaryPartyIds ?? [],
        },
        req.user.companyId
      );
      if (subErrors.length > 0) {
        return res.status(400).json({ error: "INVALID_INPUT", message: subErrors.join(" ") });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
    }

    if (data.relatedParties) {
      const relErrors = [];
      await assertRelatedPartiesExist(companyOid, data.relatedParties, relErrors);
      if (relErrors.length > 0) {
        return res.status(400).json({ error: "INVALID_INPUT", message: relErrors.join(" ") });
      }
    }

    if (data.relatedFacilities) {
      const facErrors = [];
      await assertRelatedFacilitiesExist(companyOid, data.relatedFacilities, facErrors);
      if (facErrors.length > 0) {
        return res.status(400).json({ error: "INVALID_INPUT", message: facErrors.join(" ") });
      }
    }

    let doc;
    if (Object.keys(data).length > 0) {
      doc = await Party.findOneAndUpdate({ _id: id, companyId: companyOid }, { $set: data }, { new: true });
    } else {
      doc = await Party.findOne({ _id: id, companyId: companyOid });
    }
    if (!doc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Party not found." });
    }
    const profile = await buildPartyProfile(doc);
    return res.json({ item: profile });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "DUPLICATE", message: "Alias already exists." });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update party." });
  }
}

export async function deleteParty(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid party id." });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const { isClientPortal, portalClientId } = getTradeAccess(req);
    const existing = await Party.findOne({ _id: id, companyId: companyOid });
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Party not found." });
    }
    if (isClientPortal && !(await canAccessParty(existing, req.user.companyId, portalClientId))) {
      return res.status(403).json({ error: "FORBIDDEN", message: "You cannot delete this party." });
    }

    const partyOid = existing._id;
    const [asHub, asClient] = await Promise.all([
      SupplyChain.countDocuments({ companyId: companyOid, primaryPartyId: partyOid }),
      SupplyChain.countDocuments({ companyId: companyOid, contractualPartyId: partyOid }),
    ]);
    if (asHub > 0) {
      return res.status(409).json({
        error: "IN_USE",
        message: "This party is the hub of a supply chain. Remove or reassign the chain first.",
      });
    }
    if (asClient > 0) {
      return res.status(409).json({
        error: "IN_USE",
        message: "This party is linked as contractual client on a supply chain. Remove the chain first.",
      });
    }

    await Party.updateMany(
      { companyId: companyOid, "relatedParties.relatedPartyId": partyOid },
      { $pull: { relatedParties: { relatedPartyId: partyOid } } }
    );

    const result = await Party.deleteOne({ _id: id, companyId: companyOid });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Party not found." });
    }
    return res.status(204).send();
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete party." });
  }
}
