import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Party } from "../models/Party.js";
import { SavedContainer } from "../models/SavedContainer.js";
import { SupplyChain } from "../models/SupplyChain.js";
import { logWorkspaceActivity } from "../services/workspaceActivityLog.js";
import { generateClientInviteCode } from "../utils/clientInviteCode.js";
import { contractualCodeAlternatives } from "../utils/contractualCode.js";
import { normalizeBeCode, parseBeCode } from "../../../shared/domain/beCode.js";
import {
  serializeContractualParty,
  validateContractualPartyInput,
} from "../services/tradeMasters/contractualPartyValidation.js";
import { buildClientProfile } from "../services/tradeMasters/clientProfile.js";
import { devError } from "../utils/devLog.js";
import { paginatedResponse, parseListQuery } from "../utils/listQuery.js";

function dbUnavailable(res) {
  return res.status(503).json({
    error: "DB_UNAVAILABLE",
    message: "Database not configured or unreachable.",
  });
}

function contractualQuery(companyOid, extra = {}) {
  return { companyId: companyOid, accountTier: "contractual", ...extra };
}

async function partyResponseItem(row, companyOid) {
  let parentName = null;
  if (row.parentPartyId) {
    const parent = await Party.findById(row.parentPartyId).select("legalName").lean();
    parentName = parent?.legalName ?? null;
  }
  const count = await SavedContainer.countDocuments({
    companyId: companyOid,
    contractualPartyId: row._id,
  });
  return serializeContractualParty(row, { parentName, savedContainerCount: count });
}

async function serializeClientListRows(rows, companyOid) {
  if (rows.length === 0) return [];

  const parentIds = [
    ...new Set(
      rows
        .map((r) => r.parentPartyId)
        .filter((id) => id != null && mongoose.isValidObjectId(String(id)))
        .map(String)
    ),
  ];
  const parents = parentIds.length
    ? await Party.find({ _id: { $in: parentIds } })
        .select("legalName")
        .lean()
    : [];
  const parentNameById = new Map(parents.map((p) => [String(p._id), p.legalName]));

  const partyIds = rows.map((r) => r._id);
  const counts = await SavedContainer.aggregate([
    { $match: { companyId: companyOid, contractualPartyId: { $in: partyIds } } },
    { $group: { _id: "$contractualPartyId", count: { $sum: 1 } } },
  ]);
  const countByParty = new Map(counts.map((c) => [String(c._id), c.count]));

  return rows.map((r) =>
    serializeContractualParty(r, {
      parentName: r.parentPartyId ? (parentNameById.get(String(r.parentPartyId)) ?? null) : null,
      savedContainerCount: countByParty.get(String(r._id)) ?? 0,
    })
  );
}

export async function listClients(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyId = req.user.companyId;
  const companyOid = new mongoose.Types.ObjectId(companyId);

  try {
    const { limit, skip } = parseListQuery(req.query);
    const filter = contractualQuery(companyOid);
    const [rows, total] = await Promise.all([
      Party.find(filter).sort({ legalName: 1 }).skip(skip).limit(limit).lean(),
      Party.countDocuments(filter),
    ]);
    const items = await serializeClientListRows(rows, companyOid);
    return res.json(paginatedResponse(items, total, limit, skip));
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list clients." });
  }
}

export async function getClient(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyOid = new mongoose.Types.ObjectId(req.user.companyId);
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid client id." });
  }

  try {
    const party = await Party.findOne(contractualQuery(companyOid, { _id: id })).lean();
    if (!party) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Client not found." });
    }
    const profile = await buildClientProfile(party, companyOid);
    return res.json({ item: profile });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load client profile." });
  }
}

export async function createClient(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyId = req.user.companyId;
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const name = String(req.body?.name ?? req.body?.legalName ?? "").trim();
  const codeInput = normalizeBeCode(req.body?.code);
  const country = String(req.body?.country ?? "").trim();
  if (!name) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Client name is required." });
  }

  const { errors, data: validated } = await validateContractualPartyInput(
    { ...req.body, name, legalName: name, code: codeInput || undefined },
    companyId
  );
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const candidates = validated.code ? [validated.code] : contractualCodeAlternatives(name, { country });
    let code = candidates[0];
    for (const candidate of candidates) {
      const clash = await Party.findOne({ companyId: companyOid, code: candidate });
      if (!clash) {
        code = candidate;
        break;
      }
    }
    for (let i = 0; i < 8; i += 1) {
      const clash = await Party.findOne({ companyId: companyOid, code });
      if (!clash) break;
      const parsed = parseBeCode(code);
      if (!parsed) break;
      const nameKey = `${parsed.nameKey.slice(0, 4)}${String(i + 1)}`;
      code = `${parsed.country}${nameKey}${parsed.functionCode}`;
    }

    let inviteCode = generateClientInviteCode();
    for (let i = 0; i < 8; i += 1) {
      const clash = await Party.findOne({ inviteCode });
      if (!clash) break;
      inviteCode = generateClientInviteCode();
    }

    const doc = await Party.create({
      companyId,
      legalName: validated.legalName,
      code,
      inviteCode,
      accountTier: "contractual",
      contractualTier: validated.contractualTier ?? "primary",
      parentPartyId: validated.parentPartyId ?? null,
      country,
      city: String(req.body?.city ?? "").trim(),
      address: String(req.body?.address ?? "").trim(),
      vat: validated.vat ?? "",
      notes: String(req.body?.notes ?? "").trim(),
    });

    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "client.create",
      summary: `Client party created: ${name} (${code})`,
      meta: {
        clientName: name,
        inviteCode: doc.inviteCode,
        contractualCode: code,
        contractualTier: doc.contractualTier,
      },
    });

    return res.status(201).json({
      item: await partyResponseItem(doc, companyOid),
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create client." });
  }
}

export async function updateClient(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyId = req.user.companyId;
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid client id." });
  }

  try {
    const party = await Party.findOne(contractualQuery(companyOid, { _id: id }));
    if (!party) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Client not found." });
    }

    const { errors, data: validated } = await validateContractualPartyInput(req.body, companyId, {
      partial: true,
      existing: party,
    });
    if (errors.length > 0) {
      return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
    }

    const prevName = party.legalName;
    if (validated.legalName !== undefined) party.legalName = validated.legalName;
    if (validated.code !== undefined) party.code = validated.code;
    if (validated.contractualTier !== undefined) party.contractualTier = validated.contractualTier;
    if (validated.parentPartyId !== undefined || validated.contractualTier === "primary") {
      party.parentPartyId = validated.parentPartyId ?? null;
    }
    if (validated.vat !== undefined) party.vat = validated.vat;

    await party.save();

    if (validated.legalName !== undefined) {
      await SavedContainer.updateMany(
        { companyId: companyOid, contractualPartyId: party._id },
        { $set: { clientName: party.legalName } }
      );
    }

    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "client.update",
      summary: `Client party updated: ${prevName} → ${party.legalName}`,
      meta: { clientId: String(party._id), clientName: party.legalName },
    });

    return res.json({ item: await buildClientProfile(party.toObject(), companyOid) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update client." });
  }
}

export async function deleteClient(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyId = req.user.companyId;
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid client id." });
  }

  try {
    const party = await Party.findOne(contractualQuery(companyOid, { _id: id }));
    if (!party) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Client not found." });
    }

    const subsidiaries = await Party.countDocuments({
      ...contractualQuery(companyOid),
      parentPartyId: party._id,
    });
    if (subsidiaries > 0) {
      return res.status(409).json({
        error: "IN_USE",
        message: "Remove or reassign subsidiary client parties before deleting this primary.",
      });
    }

    const chains = await SupplyChain.countDocuments({
      companyId: companyOid,
      contractualPartyId: party._id,
    });
    if (chains > 0) {
      return res.status(409).json({
        error: "IN_USE",
        message: "Remove supply chains before deleting this client party.",
      });
    }

    const inUse = await SavedContainer.countDocuments({
      companyId: companyOid,
      contractualPartyId: party._id,
    });
    if (inUse > 0) {
      return res.status(409).json({
        error: "IN_USE",
        message: "Remove or reassign saved containers before deleting this client.",
      });
    }

    const name = party.legalName;
    await Party.deleteOne({ _id: party._id });
    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "client.delete",
      summary: `Client party removed: ${name}`,
      meta: { clientName: name },
    });
    return res.status(204).send();
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete client." });
  }
}
