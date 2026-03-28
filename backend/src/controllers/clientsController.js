import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Client } from "../models/Client.js";
import { SavedContainer } from "../models/SavedContainer.js";
import { logWorkspaceActivity } from "../services/workspaceActivityLog.js";
import { generateClientInviteCode } from "../utils/clientInviteCode.js";

function dbUnavailable(res) {
  return res.status(503).json({
    error: "DB_UNAVAILABLE",
    message: "Database not configured or unreachable.",
  });
}

export async function listClients(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyId = req.user.companyId;
  const companyOid = new mongoose.Types.ObjectId(companyId);

  try {
    const rows = await Client.find({ companyId: companyOid }).sort({ name: 1 }).lean();
    if (rows.length === 0) {
      return res.json({ items: [] });
    }

    const clientIds = rows.map((r) => r._id);
    const counts = await SavedContainer.aggregate([
      { $match: { companyId: companyOid, clientId: { $in: clientIds } } },
      { $group: { _id: "$clientId", count: { $sum: 1 } } },
    ]);
    const countByClient = new Map(counts.map((c) => [String(c._id), c.count]));

    return res.json({
      items: rows.map((r) => ({
        id: r._id,
        name: r.name,
        inviteCode: r.inviteCode,
        createdAt: r.createdAt,
        savedContainerCount: countByClient.get(String(r._id)) ?? 0,
      })),
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list clients." });
  }
}

export async function createClient(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyId = req.user.companyId;
  const name = String(req.body?.name ?? "").trim();
  if (!name) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Client name is required." });
  }

  try {
    let code = generateClientInviteCode();
    for (let i = 0; i < 8; i += 1) {
      const clash = await Client.findOne({ inviteCode: code });
      if (!clash) break;
      code = generateClientInviteCode();
    }
    const doc = await Client.create({ companyId, name, inviteCode: code });
    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "client.create",
      summary: `Client created: ${name} (${code})`,
      meta: { clientName: name, inviteCode: code },
    });
    return res.status(201).json({
      item: {
        id: doc._id,
        name: doc.name,
        inviteCode: doc.inviteCode,
        createdAt: doc.createdAt,
        savedContainerCount: 0,
      },
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create client." });
  }
}

export async function updateClient(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyId = req.user.companyId;
  const { id } = req.params;
  const name = String(req.body?.name ?? "").trim();

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid client id." });
  }
  if (!name) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Client name is required." });
  }

  try {
    const client = await Client.findOne({
      _id: id,
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Client not found." });
    }

    const prevName = client.name;
    client.name = name;
    await client.save();

    await SavedContainer.updateMany(
      { companyId: new mongoose.Types.ObjectId(companyId), clientId: client._id },
      { $set: { clientName: name } }
    );

    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "client.update",
      summary: `Client renamed: ${prevName} → ${name}`,
      meta: { clientId: String(client._id), clientName: name },
    });

    const count = await SavedContainer.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      clientId: client._id,
    });

    return res.json({
      item: {
        id: client._id,
        name: client.name,
        inviteCode: client.inviteCode,
        createdAt: client.createdAt,
        savedContainerCount: count,
      },
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update client." });
  }
}

export async function deleteClient(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const companyId = req.user.companyId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid client id." });
  }

  try {
    const client = await Client.findOne({
      _id: id,
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!client) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Client not found." });
    }

    const inUse = await SavedContainer.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      clientId: client._id,
    });
    if (inUse > 0) {
      return res.status(409).json({
        error: "IN_USE",
        message: "Remove or reassign saved containers before deleting this client.",
      });
    }

    const name = client.name;
    await Client.deleteOne({ _id: client._id });
    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "client.delete",
      summary: `Client removed: ${name}`,
      meta: { clientName: name },
    });
    return res.status(204).send();
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete client." });
  }
}
