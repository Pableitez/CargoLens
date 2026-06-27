import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Party } from "../models/Party.js";
import { SupplyChain } from "../models/SupplyChain.js";
import {
  findContractualPartyById,
  resolvePrimaryContractualParty,
} from "../services/tradeMasters/contractualPartyValidation.js";
import {
  loadPartiesForChains,
  serializeSupplyChainDoc,
  validateSupplyChainInput,
} from "../services/tradeMasters/supplyChainValidation.js";
import { chainBelongsToPortal, getTradeAccess } from "../services/tradeMasters/tradeScope.js";
import { devError } from "../utils/devLog.js";
import { paginatedResponse, parseListQuery } from "../utils/listQuery.js";
import { companyObjectId, dbUnavailable } from "./controllerHelpers.js";

async function resolvePortalPrimaryPartyId(req) {
  const { portalClientId, isClientPortal } = getTradeAccess(req);
  if (!isClientPortal || !portalClientId) return null;
  const party = await findContractualPartyById(req.user.companyId, portalClientId);
  const primary = party ? await resolvePrimaryContractualParty(party) : null;
  return primary?._id ? String(primary._id) : portalClientId;
}

export async function listSupplyChains(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { isClientPortal } = getTradeAccess(req);
  const contractualPartyId = isClientPortal
    ? await resolvePortalPrimaryPartyId(req)
    : String(req.query.clientId ?? req.query.contractualPartyId ?? "").trim();
  const q = { companyId: companyObjectId(req.user.companyId) };
  if (contractualPartyId) {
    if (!mongoose.isValidObjectId(contractualPartyId)) {
      return res.status(400).json({ error: "INVALID_ID", message: "Invalid clientId." });
    }
    q.contractualPartyId = new mongoose.Types.ObjectId(contractualPartyId);
  }

  try {
    const { limit, skip } = parseListQuery(req.query);
    const [rows, total] = await Promise.all([
      SupplyChain.find(q).sort({ code: 1 }).skip(skip).limit(limit).lean(),
      SupplyChain.countDocuments(q),
    ]);
    const partyById = await loadPartiesForChains(rows);
    const items = await Promise.all(
      rows.map((r) => serializeSupplyChainDoc(req.user.companyId, r, partyById))
    );
    return res.json(paginatedResponse(items, total, limit, skip));
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list supply chains." });
  }
}

async function chainBelongsToPortalRow(chain, req) {
  const { isClientPortal } = getTradeAccess(req);
  if (!isClientPortal) return true;
  const primaryId = await resolvePortalPrimaryPartyId(req);
  return chainBelongsToPortal(chain, primaryId);
}

export async function getSupplyChain(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid supply chain id." });
  }

  try {
    const row = await SupplyChain.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    }).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Supply chain not found." });
    }
    if (!(await chainBelongsToPortalRow(row, req))) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Supply chain not accessible." });
    }
    const partyById = await loadPartiesForChains([row]);
    const item = await serializeSupplyChainDoc(req.user.companyId, row, partyById);
    return res.json({ item });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load supply chain." });
  }
}

export async function createSupplyChain(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { isClientPortal } = getTradeAccess(req);
  const body = { ...req.body };
  if (isClientPortal) {
    body.clientId = await resolvePortalPrimaryPartyId(req);
  }

  const { errors, data } = await validateSupplyChainInput(body, req.user.companyId);
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const clientParty = await findContractualPartyById(req.user.companyId, data.contractualPartyId);
    if (!clientParty) {
      return res
        .status(400)
        .json({ error: "INVALID_CLIENT", message: "Contractual client party not found." });
    }

    const doc = await SupplyChain.create({
      companyId: req.user.companyId,
      ...data,
    });
    const partyById = await loadPartiesForChains([doc.toObject()]);
    const item = await serializeSupplyChainDoc(req.user.companyId, doc.toObject(), partyById);
    return res.status(201).json({ item });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: "DUPLICATE", message: "Supply chain code already exists for this client." });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create supply chain." });
  }
}

export async function updateSupplyChain(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid supply chain id." });
  }

  try {
    const { isClientPortal } = getTradeAccess(req);
    const existing = await SupplyChain.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Supply chain not found." });
    }
    if (!(await chainBelongsToPortalRow(existing, req))) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Supply chain not accessible." });
    }

    const { errors, data } = await validateSupplyChainInput(req.body, req.user.companyId, {
      partial: true,
      existingClientId: existing.contractualPartyId,
      existingContractualPartyId: existing.contractualPartyId,
      existingPrimaryPartyId: existing.primaryPartyId,
    });
    if (errors.length > 0) {
      return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
    }

    if (data.contractualPartyId && isClientPortal) {
      const primaryId = await resolvePortalPrimaryPartyId(req);
      if (String(data.contractualPartyId) !== primaryId) {
        return res
          .status(403)
          .json({ error: "FORBIDDEN", message: "Cannot assign chain to another client." });
      }
    }

    if (data.contractualPartyId) {
      const clientParty = await findContractualPartyById(req.user.companyId, data.contractualPartyId);
      if (!clientParty) {
        return res
          .status(400)
          .json({ error: "INVALID_CLIENT", message: "Contractual client party not found." });
      }
    }

    Object.assign(existing, data);
    await existing.save();
    const partyById = await loadPartiesForChains([existing.toObject()]);
    const item = await serializeSupplyChainDoc(req.user.companyId, existing.toObject(), partyById);
    return res.json({ item });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: "DUPLICATE", message: "Supply chain code already exists for this client." });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update supply chain." });
  }
}

export async function deleteSupplyChain(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid supply chain id." });
  }

  try {
    const existing = await SupplyChain.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    });
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Supply chain not found." });
    }
    if (!(await chainBelongsToPortalRow(existing, req))) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Supply chain not accessible." });
    }

    const result = await SupplyChain.deleteOne({ _id: id, companyId: companyObjectId(req.user.companyId) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Supply chain not found." });
    }
    return res.status(204).send();
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete supply chain." });
  }
}
