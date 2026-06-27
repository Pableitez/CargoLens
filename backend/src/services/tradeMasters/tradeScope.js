import mongoose from "mongoose";
import { Party } from "../../models/Party.js";
import { partyIdsForContractualNetwork } from "../orders/contractualRelationshipNodes.js";

export function getTradeAccess(req) {
  const portalClientId =
    req.user?.clientId && String(req.user.clientId) !== "null" ? String(req.user.clientId) : null;
  return {
    companyId: req.user.companyId,
    portalClientId,
    portalPartyId: portalClientId,
    isClientPortal: Boolean(portalClientId),
  };
}

export function portalClientObjectId(portalClientId) {
  return portalClientId ? new mongoose.Types.ObjectId(portalClientId) : null;
}

export async function partyIdsForContractualParty(companyId, contractualPartyId) {
  const ids = await partyIdsForContractualNetwork(companyId, contractualPartyId);
  if (ids.length > 0) return ids;
  return [String(contractualPartyId)];
}

/** @deprecated */
export const partyIdsForClient = partyIdsForContractualParty;

export function chainBelongsToPortal(chain, portalPartyId) {
  if (!portalPartyId) return true;
  const contractualId = chain?.contractualPartyId ?? chain?.clientId;
  return contractualId != null && String(contractualId) === portalPartyId;
}

export async function canAccessParty(party, companyId, portalPartyId) {
  if (!portalPartyId) return true;
  if (String(party._id) === portalPartyId) return true;
  if ((party.accountTier ?? "operational") === "contractual") {
    const primary = await Party.findById(portalPartyId).select("parentPartyId contractualTier").lean();
    if (primary && String(party._id) === String(primary.parentPartyId ?? "")) return true;
  }
  const inNetworkIds = await partyIdsForContractualParty(companyId, portalPartyId);
  return inNetworkIds.includes(String(party._id));
}
