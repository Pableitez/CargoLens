import mongoose from "mongoose";
import { normalizeTradeCode } from "../../../../shared/domain/tradeMasters.js";
import { Party } from "../../models/Party.js";
import { buildPartyLookup, resolveOperatingParty } from "./partyLookup.js";
import {
  findContractualPartyByCode,
  findContractualPartyById,
  resolvePrimaryContractualParty,
} from "./contractualPartyValidation.js";
import {
  collectContractualRelationshipNodes,
  loadContractualRelationshipLookup,
} from "../orders/contractualRelationshipNodes.js";

function partyDisplayName(party) {
  return String(party?.legalName ?? party?.code ?? "").trim();
}

function buildTradeData(clientRow, shipperParty, consigneeParty) {
  return {
    contractualPartyId: clientRow._id,
    clientId: clientRow._id,
    supplyChainId: null,
    operatingShipperPartyId: shipperParty._id,
    operatingConsigneePartyId: consigneeParty._id,
    customer: partyDisplayName(clientRow) || clientRow.code,
    shipper: partyDisplayName(shipperParty) || shipperParty.code,
    consignee: partyDisplayName(consigneeParty) || consigneeParty.code,
  };
}

function nodeIncludesParty(nodes, role, partyId) {
  return (nodes ?? [])
    .filter((node) => node.role === role)
    .some((node) => String(node.partyId) === String(partyId));
}

/** True when the workspace has contractual customers configured. */
export async function companyUsesTradeMasters(companyId) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const contractualCount = await Party.countDocuments({
    companyId: companyOid,
    accountTier: "contractual",
  }).limit(1);
  return contractualCount > 0;
}

/**
 * Resuelve client party (contractual) + parties operativos contra party relationships.
 */
export async function resolveOrderTrade(companyId, input) {
  const errors = [];

  const contractualCode = normalizeTradeCode(
    input.contractualCode ?? input.customer ?? input.contractual_customer_code
  );
  const operatingShipperCode = String(
    input.operatingShipperCode ??
      input.operating_shipper_code ??
      input.shipper ??
      input.shipper_alias_code ??
      ""
  ).trim();
  const operatingConsigneeCode = String(
    input.operatingConsigneeCode ??
      input.operating_consignee_code ??
      input.consignee ??
      input.consignee_alias_code ??
      ""
  ).trim();

  if (!contractualCode) errors.push("contractual_code (customer) is required");

  if (errors.length > 0) {
    return { errors, data: null };
  }

  const clientRow = await findContractualPartyByCode(companyId, contractualCode);
  if (!clientRow) {
    errors.push(`contractual "${contractualCode}" not found — create the client party in Trade setup first`);
    return { errors, data: null };
  }

  const primaryClient = await resolvePrimaryContractualParty(clientRow);
  if (!primaryClient) {
    errors.push(`contractual "${contractualCode}" could not be resolved to a primary account`);
    return { errors, data: null };
  }

  if (String(primaryClient._id) !== String(clientRow._id)) {
    errors.push(
      `contractual "${contractualCode}" is a subsidiary — use primary code "${primaryClient.code}" for order import`
    );
    return { errors, data: null };
  }

  const { nodes: relationshipNodes } = await collectContractualRelationshipNodes(companyId, clientRow);
  const { parties, relationshipAliases } = await loadContractualRelationshipLookup(
    companyId,
    clientRow,
    relationshipNodes
  );
  const lookup = buildPartyLookup(parties, relationshipAliases);

  const shipperResult = resolveOperatingParty(
    null,
    "shipper",
    operatingShipperCode,
    lookup,
    relationshipNodes
  );
  if (shipperResult.error) errors.push(shipperResult.error);

  const consigneeResult = resolveOperatingParty(
    null,
    "consignee",
    operatingConsigneeCode,
    lookup,
    relationshipNodes
  );
  if (consigneeResult.error) errors.push(consigneeResult.error);

  if (errors.length > 0) {
    return { errors, data: null };
  }

  return {
    errors: [],
    data: buildTradeData(primaryClient, shipperResult.party, consigneeResult.party),
  };
}

/**
 * Resuelve trade masters desde IDs (formulario manual de pedidos).
 */
export async function resolveOrderTradeFromSelection(companyId, input) {
  const errors = [];
  const companyOid = new mongoose.Types.ObjectId(companyId);

  const contractualPartyId = String(input.contractualPartyId ?? "").trim();
  const operatingShipperPartyId = String(input.operatingShipperPartyId ?? "").trim();
  const operatingConsigneePartyId = String(input.operatingConsigneePartyId ?? "").trim();

  if (!contractualPartyId) {
    return { errors: ["contractual customer is required"], data: null };
  }
  if (!operatingShipperPartyId) {
    return { errors: ["shipper is required"], data: null };
  }
  if (!operatingConsigneePartyId) {
    return { errors: ["consignee is required"], data: null };
  }

  if (!mongoose.isValidObjectId(contractualPartyId)) {
    return { errors: ["Invalid contractual customer selection."], data: null };
  }
  if (!mongoose.isValidObjectId(operatingShipperPartyId)) {
    return { errors: ["Invalid shipper selection."], data: null };
  }
  if (!mongoose.isValidObjectId(operatingConsigneePartyId)) {
    return { errors: ["Invalid consignee selection."], data: null };
  }

  const clientRow = await findContractualPartyById(companyId, contractualPartyId);
  if (!clientRow) {
    errors.push("contractual customer not found — configure it in Trade setup first");
    return { errors, data: null };
  }

  const primaryClient = await resolvePrimaryContractualParty(clientRow);
  if (!primaryClient) {
    errors.push("contractual customer could not be resolved to a primary account");
    return { errors, data: null };
  }

  const { nodes: relationshipNodes } = await collectContractualRelationshipNodes(companyId, clientRow);

  if (!nodeIncludesParty(relationshipNodes, "shipper", operatingShipperPartyId)) {
    errors.push("selected shipper is not assigned in party relationships for this customer");
  }
  if (!nodeIncludesParty(relationshipNodes, "consignee", operatingConsigneePartyId)) {
    errors.push("selected consignee is not assigned in party relationships for this customer");
  }

  if (errors.length > 0) {
    return { errors, data: null };
  }

  const [shipperParty, consigneeParty] = await Promise.all([
    Party.findOne({ _id: operatingShipperPartyId, companyId: companyOid }).lean(),
    Party.findOne({ _id: operatingConsigneePartyId, companyId: companyOid }).lean(),
  ]);

  if (!shipperParty) errors.push("shipper party not found");
  if (!consigneeParty) errors.push("consignee party not found");

  if (errors.length > 0) {
    return { errors, data: null };
  }

  return {
    errors: [],
    data: buildTradeData(clientRow, shipperParty, consigneeParty),
  };
}
