import mongoose from "mongoose";
import { Party } from "../../models/Party.js";
import { SavedContainer } from "../../models/SavedContainer.js";
import { SupplyChain } from "../../models/SupplyChain.js";
import { resolvePrimaryContractualParty, serializeContractualParty } from "./contractualPartyValidation.js";
import { loadSupplyChainNetwork } from "./supplyChainNetwork.js";

function contractualFilter(companyOid) {
  return { companyId: companyOid, accountTier: "contractual" };
}

export async function buildClientProfile(partyDoc, companyOid) {
  const tier = partyDoc.contractualTier ?? "primary";
  const primaryParty = tier === "subsidiary" ? await resolvePrimaryContractualParty(partyDoc) : partyDoc;

  let parentName = null;
  if (partyDoc.parentPartyId) {
    const parent = await Party.findById(partyDoc.parentPartyId).select("legalName").lean();
    parentName = parent?.legalName ?? null;
  }

  const savedContainerCount = await SavedContainer.countDocuments({
    companyId: companyOid,
    contractualPartyId: partyDoc._id,
  });

  const subsidiaries =
    tier === "primary"
      ? await Party.find({ ...contractualFilter(companyOid), parentPartyId: partyDoc._id })
          .sort({ legalName: 1 })
          .lean()
      : [];

  const subsidiaryItems = await Promise.all(
    subsidiaries.map(async (row) => {
      const count = await SavedContainer.countDocuments({
        companyId: companyOid,
        contractualPartyId: row._id,
      });
      return {
        ...serializeContractualParty(row, { parentName: partyDoc.legalName, savedContainerCount: count }),
      };
    })
  );

  const chains =
    tier === "primary" && primaryParty
      ? await SupplyChain.find({
          companyId: companyOid,
          contractualPartyId: primaryParty._id,
        })
          .sort({ code: 1 })
          .select("code name direction primaryPartyId nodes")
          .lean()
      : [];

  const supplyChains = await Promise.all(
    chains.map(async (chain) => {
      const network = await loadSupplyChainNetwork(String(companyOid), chain);
      const partyCount =
        (network.primaryParty ? 1 : 0) + (network.members?.length ?? 0) || chain.nodes?.length || 0;
      return {
        id: String(chain._id),
        code: chain.code,
        name: chain.name,
        direction: chain.direction ?? "export",
        primaryPartyCode: network.primaryParty?.code ?? "",
        primaryPartyName: network.primaryParty?.legalName ?? "",
        partyCount,
      };
    })
  );

  return {
    ...serializeContractualParty(partyDoc, { parentName, savedContainerCount }),
    primaryClientId: primaryParty ? String(primaryParty._id) : null,
    primaryClientName: primaryParty?.legalName ?? null,
    primaryClientCode: primaryParty?.code ?? null,
    primaryPartyId: primaryParty ? String(primaryParty._id) : null,
    subsidiaries: subsidiaryItems,
    supplyChains,
    sectionCounts: {
      subsidiaries: subsidiaryItems.length,
      supplyChains: chains.length,
      containers: savedContainerCount,
    },
  };
}
