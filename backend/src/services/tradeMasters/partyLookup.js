import { Party } from "../../models/Party.js";
import { allPartiesInNetwork, loadSupplyChainNetwork } from "./supplyChainNetwork.js";
import {
  normalizeTradeCode,
  partyClientAliasLookupKey,
  isValidPartyRole,
} from "../../../../shared/domain/tradeMasters.js";

function nodesForRole(nodes, role) {
  return (nodes ?? []).filter((n) => n.role === role);
}

function nodeAllowsParty(nodes, role, partyId) {
  return nodesForRole(nodes, role).some((n) => String(n.partyId) === String(partyId));
}

function aliasLookupKey(role, aliasCode) {
  return `${role}:${partyClientAliasLookupKey(aliasCode)}`;
}

/**
 * @param {Array<{ _id: unknown, code: string, aliases?: Array<{ role: string, aliasCode: string }> }>} parties
 * @param {Array<{ partyId: unknown, role: string, aliasCode: string }>} [relationshipAliases]
 */
export function buildPartyLookup(parties, relationshipAliases = []) {
  const byId = new Map();
  const byCode = new Map();
  const byAlias = new Map();
  const aliasConflicts = new Set();

  for (const party of parties) {
    byId.set(String(party._id), party);
    byCode.set(party.code, party);
    for (const alias of party.aliases ?? []) {
      const key = aliasLookupKey(alias.role, alias.aliasCode);
      const existing = byAlias.get(key);
      if (existing && String(existing._id) !== String(party._id)) {
        aliasConflicts.add(key);
      }
      byAlias.set(key, party);
    }
  }

  for (const entry of relationshipAliases) {
    const role = String(entry.role ?? "")
      .trim()
      .toLowerCase();
    const aliasCode = String(entry.aliasCode ?? "").trim();
    if (!aliasCode || !isValidPartyRole(role)) continue;
    const party = byId.get(String(entry.partyId));
    if (!party) continue;
    const key = aliasLookupKey(role, aliasCode);
    const existing = byAlias.get(key);
    if (existing && String(existing._id) !== String(party._id)) {
      aliasConflicts.add(key);
    }
    byAlias.set(key, party);
  }

  return { byId, byCode, byAlias, aliasConflicts };
}

/**
 * Resolves shipper/consignee by party code or role-scoped client name within chain network.
 */
export function resolveOperatingParty(chain, role, operatingCode, lookup, operationalNodes) {
  const { byId, byCode, byAlias, aliasConflicts } = lookup;
  const nodes = operationalNodes ?? chain.nodes ?? [];
  const roleNodes = nodesForRole(nodes, role);

  if (roleNodes.length === 0) {
    return { error: `no ${role} configured in party relationships for this customer` };
  }

  if (operatingCode) {
    const raw = String(operatingCode).trim();
    const aliasKey = aliasLookupKey(role, raw);
    if (aliasConflicts.has(aliasKey)) {
      return {
        error: `operating ${role} code "${raw}" matches multiple ${role} client names in party relationships`,
      };
    }

    const partyCodeKey = normalizeTradeCode(raw);
    let party = byCode.get(partyCodeKey) ?? byAlias.get(aliasKey);
    if (!party) {
      return {
        error: `operating ${role} code "${raw}" is not a party code or ${role} client name in party relationships`,
      };
    }
    if (!nodeAllowsParty(nodes, role, party._id)) {
      return {
        error: `operating ${role} code "${raw}" is not assigned in party relationships for this customer`,
      };
    }
    return { party };
  }

  if (roleNodes.length === 1) {
    const party = byId.get(String(roleNodes[0].partyId));
    if (!party) return { error: `${role} party not found` };
    return { party };
  }

  return {
    error: `multiple ${role} parties in relationships — specify operating_${role}_code in import`,
  };
}

export async function loadPartyLookup(companyOid, chain, PartyModel = Party) {
  const network = await loadSupplyChainNetwork(companyOid, chain);
  let parties = allPartiesInNetwork(network);

  if (parties.length === 0 && (chain.nodes ?? []).length > 0) {
    const ids = chain.nodes.map((n) => n.partyId);
    parties = await PartyModel.find({ _id: { $in: ids } }).lean();
  }

  const relationshipAliases = [];
  for (const row of network.primaryParty?.relatedParties ?? []) {
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

  return buildPartyLookup(parties, relationshipAliases);
}
