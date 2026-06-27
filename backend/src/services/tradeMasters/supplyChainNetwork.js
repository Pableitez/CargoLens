import mongoose from "mongoose";
import { isValidPartyRole } from "../../../../shared/domain/tradeMasters.js";
import { Party } from "../../models/Party.js";
import { serializePartyRelation } from "./partyNestedValidation.js";

/** @typedef {{ primaryParty: object, members: Array<{ party: object, relationshipType: string, notes: string }> }} SupplyChainNetwork */

export function chainPrimaryPartyId(chainDoc) {
  if (chainDoc?.primaryPartyId) return String(chainDoc.primaryPartyId);
  return null;
}

export async function loadSupplyChainNetwork(companyId, chainDoc) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const primaryPartyId = chainPrimaryPartyId(chainDoc);

  if (!primaryPartyId) {
    return loadLegacyNetworkFromNodes(companyOid, chainDoc);
  }

  const primaryParty = await Party.findOne({ _id: primaryPartyId, companyId: companyOid }).lean();
  if (!primaryParty) {
    return { primaryParty: null, members: [], legacy: false };
  }

  const relatedIds = (primaryParty.relatedParties ?? []).map((r) => r.relatedPartyId).filter(Boolean);
  const relatedDocs =
    relatedIds.length > 0 ? await Party.find({ companyId: companyOid, _id: { $in: relatedIds } }).lean() : [];
  const relatedById = new Map(relatedDocs.map((p) => [String(p._id), p]));

  const members = (primaryParty.relatedParties ?? []).map((row) =>
    serializePartyRelation(row, relatedById.get(String(row.relatedPartyId)))
  );

  return {
    primaryParty,
    members: members
      .map((m) => ({
        party: relatedById.get(m.relatedPartyId),
        relationshipType: m.relationshipType,
        clientAlias: m.clientAlias,
        notes: m.notes,
        relatedPartyCode: m.relatedPartyCode,
        relatedPartyName: m.relatedPartyName,
      }))
      .filter((m) => m.party),
    legacy: false,
  };
}

async function loadLegacyNetworkFromNodes(companyOid, chainDoc) {
  const nodeIds = [...new Set((chainDoc.nodes ?? []).map((n) => String(n.partyId)).filter(Boolean))];
  if (nodeIds.length === 0) {
    return { primaryParty: null, members: [], legacy: true };
  }

  const parties = await Party.find({ companyId: companyOid, _id: { $in: nodeIds } }).lean();
  const partyById = new Map(parties.map((p) => [String(p._id), p]));
  const primaryRole = chainDoc.primaryRole ?? "shipper";
  const primaryNode =
    (chainDoc.nodes ?? []).find((n) => n.role === primaryRole) ?? chainDoc.nodes?.[0] ?? null;
  const primaryParty = primaryNode ? (partyById.get(String(primaryNode.partyId)) ?? null) : null;

  const members = (chainDoc.nodes ?? [])
    .filter((n) => !primaryParty || String(n.partyId) !== String(primaryParty._id))
    .map((n) => ({
      party: partyById.get(String(n.partyId)),
      relationshipType: n.role ?? "other",
      notes: "",
      relatedPartyCode: partyById.get(String(n.partyId))?.code ?? "",
      relatedPartyName: partyById.get(String(n.partyId))?.legalName ?? "",
    }))
    .filter((m) => m.party);

  return { primaryParty, members, legacy: true };
}

export function allPartiesInNetwork(network) {
  const parties = [];
  if (network.primaryParty) parties.push(network.primaryParty);
  for (const member of network.members ?? []) {
    if (member.party) parties.push(member.party);
  }
  return parties;
}

export function allPartyIdsInNetwork(network) {
  return allPartiesInNetwork(network).map((p) => String(p._id));
}

/** Derive shipper/consignee (etc.) nodes from hub related parties, hub primary role, and aliases. */
export function deriveOperationalNodes(network, options = {}) {
  const normalized = Array.isArray(options) ? { legacyNodes: options } : options;
  const { legacyNodes = [], primaryRole = "shipper" } = normalized;

  if (legacyNodes.length > 0) {
    return legacyNodes.map((n) => ({ partyId: String(n.partyId), role: n.role }));
  }

  const nodes = [];
  const seen = new Set();

  function pushNode(partyId, role) {
    const id = String(partyId ?? "").trim();
    const r = String(role ?? "")
      .trim()
      .toLowerCase();
    if (!id || !isValidPartyRole(r)) return;
    const key = `${id}:${r}`;
    if (seen.has(key)) return;
    seen.add(key);
    nodes.push({ partyId: id, role: r });
  }

  if (network.primaryParty) {
    pushNode(network.primaryParty._id, primaryRole);
    for (const alias of network.primaryParty.aliases ?? []) {
      pushNode(network.primaryParty._id, alias.role);
    }
  }

  for (const member of network.members ?? []) {
    if (!member.party) continue;
    pushNode(member.party._id, member.relationshipType);
    for (const alias of member.party.aliases ?? []) {
      pushNode(member.party._id, alias.role);
    }
  }

  return nodes;
}

export async function loadPartiesForChainDocs(companyId, docs) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const ids = new Set();

  for (const doc of docs) {
    const primaryId = chainPrimaryPartyId(doc);
    if (primaryId) ids.add(primaryId);
    for (const node of doc.nodes ?? []) {
      if (node.partyId) ids.add(String(node.partyId));
    }
  }

  if (ids.size === 0) return new Map();

  const primaries = await Party.find({ companyId: companyOid, _id: { $in: [...ids] } }).lean();
  const primaryById = new Map(primaries.map((p) => [String(p._id), p]));

  for (const doc of docs) {
    const primaryId = chainPrimaryPartyId(doc);
    const primary = primaryId ? primaryById.get(primaryId) : null;
    if (primary) {
      for (const rel of primary.relatedParties ?? []) {
        if (rel.relatedPartyId) ids.add(String(rel.relatedPartyId));
      }
    }
  }

  const parties = await Party.find({ companyId: companyOid, _id: { $in: [...ids] } }).lean();
  return new Map(parties.map((p) => [String(p._id), p]));
}
