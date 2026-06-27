import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { findContractualPartyById } from "../services/tradeMasters/contractualPartyValidation.js";
import {
  attachClientMeta,
  clientMetaById,
  displayNameForUser,
  findConversationForAccess,
  getMessageAccess,
  senderKindForAccess,
  serializeMessage,
  touchConversation,
} from "../services/messages/messageAccess.js";
import { devError } from "../utils/devLog.js";
import { paginatedResponse, parseListQuery } from "../utils/listQuery.js";
import { companyObjectId, dbUnavailable } from "./controllerHelpers.js";

export async function listConversations(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const access = getMessageAccess(req);
  const companyOid = companyObjectId(access.companyId);

  try {
    const q = { companyId: companyOid };
    if (!access.isStaff) {
      q.contractualPartyId = new mongoose.Types.ObjectId(access.clientId);
    }

    const { limit, skip } = parseListQuery(req.query);
    const [rows, total] = await Promise.all([
      Conversation.find(q).sort({ lastMessageAt: -1, updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Conversation.countDocuments(q),
    ]);
    const items = await attachClientMeta(companyOid, rows);
    return res.json(paginatedResponse(items, total, limit, skip));
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list conversations." });
  }
}

export async function openConversation(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const access = getMessageAccess(req);
  const companyOid = companyObjectId(access.companyId);

  const clientId = access.isStaff ? String(req.body?.clientId ?? "").trim() : access.clientId;
  if (!clientId || !mongoose.isValidObjectId(clientId)) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "clientId is required." });
  }

  if (!access.isStaff && clientId !== access.clientId) {
    return res
      .status(403)
      .json({ error: "FORBIDDEN", message: "You cannot open another client's conversation." });
  }

  try {
    const party = await findContractualPartyById(access.companyId, clientId);
    if (!party) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Client not found." });
    }

    let conversation = await Conversation.findOne({
      companyId: companyOid,
      contractualPartyId: party._id,
    });
    if (!conversation) {
      conversation = await Conversation.create({
        companyId: companyOid,
        contractualPartyId: party._id,
        kind: "client_account",
        subject: party.legalName ?? "",
      });
    }

    const meta = await clientMetaById(companyOid, party._id);
    return res.json({
      item: {
        id: String(conversation._id),
        clientId: String(conversation.contractualPartyId),
        clientName: meta.name,
        clientCode: meta.code,
        kind: conversation.kind,
        subject: conversation.subject || meta.name,
        lastMessageAt: conversation.lastMessageAt,
        lastMessagePreview: conversation.lastMessagePreview ?? "",
        externalParticipantCount: conversation.externalParticipants?.length ?? 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not open conversation." });
  }
}

export async function listMessages(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const access = getMessageAccess(req);
  const { id } = req.params;

  const conversation = await findConversationForAccess(id, access);
  if (!conversation) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Conversation not found." });
  }

  try {
    const rows = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    return res.json({ items: rows.map(serializeMessage) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load messages." });
  }
}

export async function postMessage(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const access = getMessageAccess(req);
  const { id } = req.params;
  const body = String(req.body?.body ?? "").trim();

  if (!body) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Message body is required." });
  }
  if (body.length > 4000) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Message is too long." });
  }

  const conversation = await findConversationForAccess(id, access);
  if (!conversation) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Conversation not found." });
  }

  try {
    const senderDisplayName = await displayNameForUser(access.userId);
    const doc = await Message.create({
      companyId: conversation.companyId,
      conversationId: conversation._id,
      senderUserId: access.userId,
      senderKind: senderKindForAccess(access),
      senderDisplayName,
      senderEmail: access.email,
      body,
    });
    await touchConversation(conversation._id, body);
    return res.status(201).json({ item: serializeMessage(doc) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not send message." });
  }
}

export async function addExternalParticipant(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const access = getMessageAccess(req);
  if (!access.isStaff) {
    return res.status(403).json({ error: "FORBIDDEN", message: "Only staff can invite external contacts." });
  }

  const { id } = req.params;
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const name = String(req.body?.name ?? "")
    .trim()
    .slice(0, 120);

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "Valid email is required." });
  }

  const conversation = await findConversationForAccess(id, access);
  if (!conversation) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Conversation not found." });
  }

  try {
    const doc = await Conversation.findOneAndUpdate(
      { _id: conversation._id },
      {
        $push: {
          externalParticipants: {
            email,
            name,
            addedByUserId: access.userId,
          },
        },
      },
      { new: true }
    ).lean();

    return res.json({
      item: {
        externalParticipants: (doc.externalParticipants ?? []).map((p) => ({
          id: String(p._id),
          email: p.email,
          name: p.name ?? "",
        })),
      },
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not add external contact." });
  }
}
