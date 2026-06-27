import mongoose from "mongoose";
import { isValidPartyRole } from "../../../../shared/domain/tradeMasters.js";
import { Party } from "../../models/Party.js";
import {
  findContractualPartyById,
  resolvePrimaryContractualParty,
} from "../tradeMasters/contractualPartyValidation.js";

const ORDER_TRADE_ROLES = new Set(["shipper", "consignee"]);

export function deriveOrderTradeNodes(network, { chain = null } = {}) {
  const nodes = [];
  const seen = new Set();

  function pushNode(partyId, role) {
    const id = String(partyId ?? "").trim();
    const r = String(role ?? "")
      .trim()
      .toLowerCase();
    if (!id || !ORDER_TRADE_ROLES.has(r)) return;
    const key = `${id}:${r}`;
    if (seen.has(key)) return;
    seen.add(key);
    nodes.push({ partyId: id, role: r });
  }

  if (network.primaryParty) {
    if (chain?.primaryRole && isValidPartyRole(chain.primaryRole)) {
      pushNode(network.primaryParty._id, chain.primaryRole);
    }
    for (const alias of network.primaryParty.aliases ?? []) {
      pushNode(network.primaryParty._id, alias.role);
    }
  }

  for (const member of network.members ?? []) {
    if (!member.party) continue;
    if (member.primaryRole && isValidPartyRole(member.primaryRole)) {
      pushNode(network.primaryParty._id, member.primaryRole);
    }
    pushNode(member.party._id, member.relationshipType);
  }

  return nodes;
}

export async function loadHubNetwork(companyOid, hubParty) {
  const relatedIds = (hubParty.relatedParties ?? []).map((r) => r.relatedPartyId).filter(Boolean);
  if (relatedIds.length === 0) {
    return { primaryParty: hubParty, members: [] };
  }

  const relatedDocs = await Party.find({ companyId: companyOid, _id: { $in: relatedIds } }).lean();
  const relatedById = new Map(relatedDocs.map((p) => [String(p._id), p]));

  return {
    primaryParty: hubParty,
    members: (hubParty.relatedParties ?? [])
      .map((row) => ({
        party: relatedById.get(String(row.relatedPartyId)),
        relationshipType: row.relationshipType ?? "other",
        primaryRole: row.primaryRole ?? "",
      }))
      .filter((member) => member.party),
  };
}

function dedupeNodes(nodes) {
  const seen = new Set();
  const out = [];
  for (const node of nodes) {
    const key = `${node.role}:${String(node.partyId)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(node);
  }
  return out;
}

async function nodesFromDirectHub(companyOid, hubParty) {
  if (!hubParty?.relatedParties?.length) return [];

  const network = await loadHubNetwork(companyOid, hubParty);
  return deriveOrderTradeNodes(network, { chain: null });
}

async function loadContractualHubParties(companyOid, clientRow) {
  const primaryClient = await resolvePrimaryContractualParty(clientRow);
  if (!primaryClient) return [];

  const hubIds = new Set([String(primaryClient._id), String(clientRow._id)]);

  const subsidiaries = await Party.find({
    companyId: companyOid,
    parentPartyId: primaryClient._id,
    accountTier: "contractual",
    contractualTier: "subsidiary",
  })
    .select("_id")
    .lean();

  for (const row of subsidiaries) {
    hubIds.add(String(row._id));
  }

  return Party.find({
    companyId: companyOid,
    _id: { $in: [...hubIds].map((id) => new mongoose.Types.ObjectId(id)) },
  }).lean();
}

/**
 * Shipper/consignee nodes for one contractual customer from party relationships only.
 */
export async function collectContractualRelationshipNodes(companyId, clientRow) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const hubParties = await loadContractualHubParties(companyOid, clientRow);
  const allNodes = [];

  for (const hub of hubParties) {
    allNodes.push(...(await nodesFromDirectHub(companyOid, hub)));
  }

  return { nodes: dedupeNodes(allNodes) };
}

export async function loadContractualRelationshipLookup(companyId, clientRow, relationshipNodes) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const hubParties = await loadContractualHubParties(companyOid, clientRow);

  const relatedIds = hubParties.flatMap((hub) =>
    (hub.relatedParties ?? []).map((row) => String(row.relatedPartyId)).filter(Boolean)
  );
  const nodeIds = (relationshipNodes ?? []).map((node) => String(node.partyId)).filter(Boolean);
  const hubIds = hubParties.map((hub) => String(hub._id));
  const allIds = [...new Set([...hubIds, ...relatedIds, ...nodeIds])];

  const parties =
    allIds.length > 0
      ? await Party.find({
          companyId: companyOid,
          _id: { $in: allIds.map((id) => new mongoose.Types.ObjectId(id)) },
        }).lean()
      : [];

  const relationshipAliases = [];
  for (const hub of hubParties) {
    for (const row of hub.relatedParties ?? []) {
      const clientAlias = String(row.clientAlias ?? "").trim();
      const role = String(row.relationshipType ?? "")
        .trim()
        .toLowerCase();
      if (!clientAlias || !isValidPartyRole(role)) continue;
      relationshipAliases.push({
        partyId: row.relatedPartyId,
        role,
        aliasCode: clientAlias,
      });
    }
  }

  return { parties, relationshipAliases };
}

/** Party ids visible for one contractual customer (hubs, subsidiaries, linked parties). */
export async function partyIdsForContractualNetwork(companyId, contractualPartyId) {
  const id = String(contractualPartyId ?? "").trim();
  if (!id || !mongoose.isValidObjectId(id)) return [];

  const clientRow = await findContractualPartyById(companyId, id);
  if (!clientRow) return [];

  const companyOid = new mongoose.Types.ObjectId(companyId);
  const primaryClient = await resolvePrimaryContractualParty(clientRow);
  const hubParties = await loadContractualHubParties(companyOid, clientRow);

  const ids = new Set([String(clientRow._id)]);
  if (primaryClient) ids.add(String(primaryClient._id));

  for (const hub of hubParties) {
    ids.add(String(hub._id));
    for (const rel of hub.relatedParties ?? []) {
      if (rel.relatedPartyId) ids.add(String(rel.relatedPartyId));
    }
  }

  return [...ids];
}
