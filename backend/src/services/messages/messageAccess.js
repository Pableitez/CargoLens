import mongoose from "mongoose";
import { Party } from "../../models/Party.js";
import { Conversation } from "../../models/Conversation.js";
import { User } from "../../models/User.js";

export function getMessageAccess(req) {
  const clientId =
    req.user?.clientId && String(req.user.clientId) !== "null" ? String(req.user.clientId) : null;
  return {
    companyId: String(req.user.companyId),
    userId: String(req.user.userId),
    email: req.user.email ?? "",
    clientId,
    isStaff: !clientId,
  };
}

export async function canAccessConversation(conversation, access) {
  if (String(conversation.companyId) !== access.companyId) return false;
  if (access.isStaff) return true;
  return String(conversation.contractualPartyId) === access.clientId;
}

export async function findConversationForAccess(id, access) {
  if (!mongoose.isValidObjectId(id)) return null;
  const conversation = await Conversation.findOne({
    _id: id,
    companyId: new mongoose.Types.ObjectId(access.companyId),
  }).lean();
  if (!conversation) return null;
  if (!(await canAccessConversation(conversation, access))) return null;
  return conversation;
}

export function senderKindForAccess(access) {
  return access.isStaff ? "staff" : "client_portal";
}

export async function displayNameForUser(userId) {
  const user = await User.findById(userId).select("displayName email").lean();
  if (!user) return "User";
  return user.displayName?.trim() || user.email || "User";
}

export function serializeConversation(doc, clientMeta = {}) {
  return {
    id: String(doc._id),
    clientId: doc.contractualPartyId ? String(doc.contractualPartyId) : null,
    clientName: clientMeta.name ?? "",
    clientCode: clientMeta.code ?? "",
    kind: doc.kind ?? "client_account",
    subject: doc.subject ?? "",
    lastMessageAt: doc.lastMessageAt,
    lastMessagePreview: doc.lastMessagePreview ?? "",
    externalParticipantCount: doc.externalParticipants?.length ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function serializeMessage(doc) {
  return {
    id: String(doc._id),
    conversationId: String(doc.conversationId),
    senderKind: doc.senderKind,
    senderDisplayName: doc.senderDisplayName ?? "",
    senderEmail: doc.senderEmail ?? "",
    body: doc.body,
    createdAt: doc.createdAt,
  };
}

export async function clientMetaById(companyId, partyId) {
  const party = await Party.findOne({
    _id: partyId,
    companyId,
    accountTier: "contractual",
  })
    .select("legalName code")
    .lean();
  return party ? { name: party.legalName ?? "", code: party.code ?? "" } : { name: "", code: "" };
}

export async function attachClientMeta(companyOid, rows) {
  const partyIds = [...new Set(rows.map((r) => String(r.contractualPartyId)))];
  const parties = await Party.find({
    companyId: companyOid,
    accountTier: "contractual",
    _id: { $in: partyIds },
  })
    .select("legalName code")
    .lean();
  const byId = new Map(parties.map((p) => [String(p._id), { name: p.legalName ?? "", code: p.code ?? "" }]));
  return rows.map((row) => serializeConversation(row, byId.get(String(row.contractualPartyId)) ?? {}));
}

export async function touchConversation(conversationId, body) {
  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessageAt: new Date(),
        lastMessagePreview: String(body).trim().slice(0, 160),
      },
    }
  );
}
