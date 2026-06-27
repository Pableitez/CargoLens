import mongoose from "mongoose";
import { Party } from "../../models/Party.js";
import {
  findContractualPartyById,
  resolvePrimaryContractualParty,
} from "../tradeMasters/contractualPartyValidation.js";
import { serializeChainNode } from "../tradeMasters/supplyChainValidation.js";
import { collectContractualRelationshipNodes } from "./contractualRelationshipNodes.js";

function dedupeRoleNodes(nodes) {
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

function serializeRoleOptions(nodes, partyById) {
  return {
    shippers: dedupeRoleNodes(nodes.filter((node) => node.role === "shipper")).map((node) =>
      serializeChainNode(node, partyById)
    ),
    consignees: dedupeRoleNodes(nodes.filter((node) => node.role === "consignee")).map((node) =>
      serializeChainNode(node, partyById)
    ),
  };
}

export async function getOrderTradePartyOptions(companyId, contractualPartyId) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const id = String(contractualPartyId ?? "").trim();

  if (!id || !mongoose.isValidObjectId(id)) {
    return {
      errors: ["Invalid contractual customer."],
      shippers: [],
      consignees: [],
      defaults: null,
    };
  }

  const clientRow = await findContractualPartyById(companyId, id);
  if (!clientRow) {
    return {
      errors: ["Contractual customer not found."],
      shippers: [],
      consignees: [],
      defaults: null,
    };
  }

  const primaryClient = await resolvePrimaryContractualParty(clientRow);
  if (!primaryClient) {
    return {
      errors: ["Contractual customer could not be resolved to a primary account."],
      shippers: [],
      consignees: [],
      defaults: null,
    };
  }

  const { nodes: allNodes } = await collectContractualRelationshipNodes(companyId, clientRow);

  const partyIds = [...new Set(allNodes.map((node) => String(node.partyId)).filter(Boolean))];
  const parties =
    partyIds.length > 0 ? await Party.find({ companyId: companyOid, _id: { $in: partyIds } }).lean() : [];
  const partyById = new Map(parties.map((party) => [String(party._id), party]));

  const { shippers, consignees } = serializeRoleOptions(allNodes, partyById);

  return {
    errors: [],
    shippers,
    consignees,
    defaults: null,
    primaryClientId: String(primaryClient._id),
    contractualPartyId: String(clientRow._id),
  };
}
