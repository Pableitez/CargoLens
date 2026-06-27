import mongoose from "mongoose";
import {
  isValidSupplyChainDirection,
  isValidSupplyChainPrimaryRole,
  normalizeTradeCode,
} from "../../../../shared/domain/tradeMasters.js";
import { Party } from "../../models/Party.js";
import { findContractualPartyById, resolvePrimaryContractualParty } from "./contractualPartyValidation.js";
import { allPartiesInNetwork, deriveOperationalNodes, loadSupplyChainNetwork } from "./supplyChainNetwork.js";

function serializeMember(member) {
  return {
    partyId: String(member.party._id),
    partyCode: member.party.code ?? "",
    partyLegalName: member.party.legalName ?? "",
    relationshipType: member.relationshipType ?? "other",
    notes: member.notes ?? "",
  };
}

export function serializeChainNode(node, partyById) {
  const party = partyById.get(String(node.partyId));
  return {
    partyId: String(node.partyId),
    partyCode: party?.code ?? "",
    partyLegalName: party?.legalName ?? "",
    role: node.role,
  };
}

export async function serializeSupplyChainDoc(companyId, doc, partyById) {
  const network = await loadSupplyChainNetwork(companyId, doc);
  const operationalNodes = deriveOperationalNodes(network, {
    legacyNodes: doc.nodes ?? [],
    primaryRole: doc.primaryRole ?? "shipper",
  });
  const nodes = operationalNodes.map((n) => serializeChainNode(n, partyById));

  const members = (network.members ?? []).map(serializeMember);

  return {
    id: doc._id,
    contractualPartyId: doc.contractualPartyId ? String(doc.contractualPartyId) : null,
    clientId: doc.contractualPartyId ? String(doc.contractualPartyId) : null,
    primaryPartyId: doc.primaryPartyId ? String(doc.primaryPartyId) : null,
    primaryPartyCode: network.primaryParty?.code ?? "",
    primaryPartyName: network.primaryParty?.legalName ?? "",
    code: doc.code,
    name: doc.name,
    direction: doc.direction ?? "export",
    primaryRole: doc.primaryRole ?? "shipper",
    defaultIncoterm: doc.defaultIncoterm ?? "",
    defaultTransportMode: doc.defaultTransportMode ?? "",
    defaultPortOfLoading: doc.defaultPortOfLoading ?? "",
    defaultPortOfDischarge: doc.defaultPortOfDischarge ?? "",
    members,
    nodes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** @deprecated use serializeSupplyChainDoc */
export function serializeSupplyChain(doc, partyById) {
  const operationalNodes = doc.nodes ?? [];
  const nodes = operationalNodes.map((n) => serializeChainNode(n, partyById));
  return {
    id: doc._id,
    contractualPartyId: doc.contractualPartyId ? String(doc.contractualPartyId) : null,
    clientId: doc.contractualPartyId ? String(doc.contractualPartyId) : null,
    primaryPartyId: doc.primaryPartyId ? String(doc.primaryPartyId) : null,
    primaryPartyCode: "",
    primaryPartyName: "",
    code: doc.code,
    name: doc.name,
    direction: doc.direction ?? "export",
    primaryRole: doc.primaryRole ?? "shipper",
    defaultIncoterm: doc.defaultIncoterm ?? "",
    defaultTransportMode: doc.defaultTransportMode ?? "",
    defaultPortOfLoading: doc.defaultPortOfLoading ?? "",
    defaultPortOfDischarge: doc.defaultPortOfDischarge ?? "",
    members: [],
    nodes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function assertContractualParty(contractualPartyId, companyId) {
  const party = await findContractualPartyById(companyId, contractualPartyId);
  if (!party) {
    return { ok: false, error: "Contractual client party not found." };
  }
  return { ok: true, client: party, party };
}

export async function assertPrimaryContractual(contractualPartyId, companyId) {
  const party = await findContractualPartyById(companyId, contractualPartyId);
  if (!party) {
    return { ok: false, error: "Contractual client party not found." };
  }
  const primary = await resolvePrimaryContractualParty(party);
  if (!primary || String(primary._id) !== String(party._id)) {
    return {
      ok: false,
      error: "Supply chains must belong to a primary client party (not a subsidiary).",
    };
  }
  return { ok: true, client: primary, party: primary };
}

export async function validateSupplyChainInput(
  body,
  companyId,
  { partial = false, existingClientId, existingContractualPartyId, existingPrimaryPartyId } = {}
) {
  const errors = [];
  const data = {};
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const existingCp = existingContractualPartyId ?? existingClientId;

  if (!partial || body?.clientId !== undefined || body?.contractualPartyId !== undefined) {
    const contractualPartyId = String(body?.contractualPartyId ?? body?.clientId ?? existingCp ?? "").trim();
    if (!mongoose.isValidObjectId(contractualPartyId)) {
      errors.push("contractualPartyId is required");
    } else {
      const check = await assertContractualParty(contractualPartyId, companyId);
      if (!check.ok) errors.push(check.error);
      else data.contractualPartyId = check.party._id;
    }
  }

  if (!partial || body?.primaryPartyId !== undefined) {
    const primaryPartyId = String(body?.primaryPartyId ?? existingPrimaryPartyId ?? "").trim();
    if (!mongoose.isValidObjectId(primaryPartyId)) {
      if (!partial) errors.push("primaryPartyId is required");
    } else {
      const party = await Party.findOne({ _id: primaryPartyId, companyId: companyOid }).lean();
      if (!party) {
        errors.push("primary party not found in company registry");
      } else {
        data.primaryPartyId = party._id;
      }
    }
  }

  if (!partial || body?.code !== undefined) {
    const code = normalizeTradeCode(body?.code);
    if (!code) errors.push("code is required");
    else if (code.length > 40) errors.push("code must be at most 40 characters");
    else data.code = code;
  }

  if (!partial || body?.name !== undefined) {
    const name = String(body?.name ?? "").trim();
    if (!name) errors.push("name is required");
    else data.name = name.slice(0, 120);
  }

  if (body?.direction !== undefined) {
    const direction = String(body.direction ?? "")
      .trim()
      .toLowerCase();
    if (!isValidSupplyChainDirection(direction)) errors.push("direction must be export, import, or domestic");
    else data.direction = direction;
  }

  if (body?.primaryRole !== undefined) {
    const primaryRole = String(body.primaryRole ?? "")
      .trim()
      .toLowerCase();
    if (!isValidSupplyChainPrimaryRole(primaryRole)) errors.push("primaryRole must be shipper or consignee");
    else data.primaryRole = primaryRole;
  }

  for (const field of [
    "defaultIncoterm",
    "defaultTransportMode",
    "defaultPortOfLoading",
    "defaultPortOfDischarge",
  ]) {
    if (body?.[field] !== undefined) {
      data[field] = String(body[field] ?? "")
        .trim()
        .slice(0, 80);
    }
  }

  // Legacy nodes input — ignored on create when primaryPartyId set; kept for partial API compat
  if (body?.nodes !== undefined && !data.primaryPartyId && !existingPrimaryPartyId) {
    errors.push("Use primaryPartyId — supply chain members come from the primary party's related parties.");
  }

  return { errors, data };
}

export async function loadPartiesForChains(docs) {
  const ids = new Set();
  for (const doc of docs) {
    if (doc.primaryPartyId) ids.add(String(doc.primaryPartyId));
    for (const node of doc.nodes ?? []) {
      ids.add(String(node.partyId));
    }
  }
  if (ids.size === 0) return new Map();

  const companyId = docs[0]?.companyId;
  if (!companyId) {
    const parties = await Party.find({ _id: { $in: [...ids] } }).lean();
    return new Map(parties.map((p) => [String(p._id), p]));
  }

  const { loadPartiesForChainDocs } = await import("./supplyChainNetwork.js");
  return loadPartiesForChainDocs(companyId, docs);
}

export async function resolveChainOperationalNodes(companyId, chainDoc) {
  const network = await loadSupplyChainNetwork(companyId, chainDoc);
  return deriveOperationalNodes(network, {
    legacyNodes: chainDoc.nodes ?? [],
    primaryRole: chainDoc.primaryRole ?? "shipper",
  });
}

export { allPartiesInNetwork, loadSupplyChainNetwork };
