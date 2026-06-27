import mongoose from "mongoose";
import { Client } from "../../models/Client.js";
import { Facility } from "../../models/Facility.js";
import { Party } from "../../models/Party.js";
import { SupplyChain } from "../../models/SupplyChain.js";
import {
  serializePartyAddress,
  serializePartyAlias,
  serializePartyContact,
  serializePartyFacility,
  serializePartyRelation,
} from "./partyNestedValidation.js";
import { serializeParty } from "./partyValidation.js";
import { loadPartySubsidiaries } from "./partySubsidiaries.js";
import { loadSupplyChainNetwork } from "./supplyChainNetwork.js";

const CHAIN_FIELDS =
  "code name contractualPartyId clientId primaryPartyId direction primaryRole defaultIncoterm defaultTransportMode defaultPortOfLoading defaultPortOfDischarge nodes";

function countAddresses(partyDoc) {
  let count = partyDoc.addressBook?.length ?? 0;
  if (partyDoc.address?.trim() && count === 0) count = 1;
  return count;
}

function resolveContractualPartyId(chain) {
  const raw = chain.contractualPartyId ?? chain.clientId;
  if (!raw || !mongoose.isValidObjectId(String(raw))) return null;
  return String(raw);
}

function resolvePrimaryPartyId(chain) {
  if (chain.primaryPartyId && mongoose.isValidObjectId(String(chain.primaryPartyId))) {
    return String(chain.primaryPartyId);
  }
  const role = chain.primaryRole ?? "shipper";
  const node = (chain.nodes ?? []).find((n) => n.role === role) ?? chain.nodes?.[0];
  if (node?.partyId && mongoose.isValidObjectId(String(node.partyId))) {
    return String(node.partyId);
  }
  return null;
}

function hubSnapshot(hubById, hubPartyId) {
  if (!hubPartyId) {
    return { hubPartyId: "", hubPartyName: "", hubPartyCode: "" };
  }
  const hub = hubById.get(hubPartyId);
  return {
    hubPartyId,
    hubPartyName: hub?.legalName ?? "",
    hubPartyCode: hub?.code ?? "",
  };
}

function relationshipFromHub(hubDoc, memberPartyId) {
  if (!hubDoc?.relatedParties?.length) return "";
  const link = hubDoc.relatedParties.find(
    (row) => row.relatedPartyId && String(row.relatedPartyId) === String(memberPartyId)
  );
  return link?.relationshipType ?? "";
}

export async function buildPartyProfile(partyDoc) {
  const partyId = partyDoc._id;
  const companyId = partyDoc.companyId;
  const companyOid = new mongoose.Types.ObjectId(companyId);

  const isContractualPrimary =
    (partyDoc.accountTier ?? "operational") === "contractual" &&
    (partyDoc.contractualTier ?? "primary") === "primary";

  const chainsOwned = isContractualPrimary
    ? await SupplyChain.find({
        companyId: companyOid,
        contractualPartyId: partyId,
      })
        .select(CHAIN_FIELDS)
        .lean()
    : [];

  const chainsAsPrimary = await SupplyChain.find({
    companyId: companyOid,
    primaryPartyId: partyId,
  })
    .select(CHAIN_FIELDS)
    .lean();

  const chainsLegacy = await SupplyChain.find({
    companyId: companyOid,
    primaryPartyId: { $in: [null, undefined] },
    "nodes.partyId": partyId,
  })
    .select(CHAIN_FIELDS)
    .lean();

  const chainsByPrimary = await SupplyChain.find({
    companyId: companyOid,
    primaryPartyId: { $ne: null, $nin: [partyId] },
  })
    .select(CHAIN_FIELDS)
    .lean();

  const memberChainIds = new Set();
  for (const chain of chainsByPrimary) {
    const network = await loadSupplyChainNetwork(companyId, chain);
    const inNetwork = (network.members ?? []).some((m) => m.party && String(m.party._id) === String(partyId));
    if (inNetwork) memberChainIds.add(String(chain._id));
  }

  const memberChains = chainsByPrimary.filter((c) => memberChainIds.has(String(c._id)));

  const allChains = [
    ...chainsOwned,
    ...chainsAsPrimary,
    ...memberChains,
    ...chainsLegacy.filter(
      (c) =>
        !chainsOwned.some((o) => String(o._id) === String(c._id)) &&
        !chainsAsPrimary.some((p) => String(p._id) === String(c._id)) &&
        !memberChainIds.has(String(c._id))
    ),
  ];

  const clientIds = [...new Set(allChains.map((c) => resolveContractualPartyId(c)).filter(Boolean))];

  const hubIds = new Set();
  for (const chain of allChains) {
    const hubId = resolvePrimaryPartyId(chain);
    if (hubId) hubIds.add(hubId);
  }

  const [clients, legacyClients, hubParties] = await Promise.all([
    clientIds.length > 0
      ? Party.find({ _id: { $in: clientIds }, accountTier: "contractual" })
          .select("legalName code")
          .lean()
      : [],
    clientIds.length > 0
      ? Client.find({ _id: { $in: clientIds } })
          .select("name code")
          .lean()
      : [],
    hubIds.size > 0
      ? Party.find({ companyId: companyOid, _id: { $in: [...hubIds] } })
          .select("legalName code relatedParties")
          .lean()
      : [],
  ]);

  const clientById = new Map(clients.map((c) => [String(c._id), c]));
  for (const row of legacyClients) {
    if (!clientById.has(String(row._id))) {
      clientById.set(String(row._id), { legalName: row.name, code: row.code });
    }
  }
  const hubById = new Map(hubParties.map((p) => [String(p._id), p]));

  const roles = new Set();
  const chainMemberships = [];
  const chainPositionCounts = { primary: 0, member: 0 };

  for (const chain of chainsAsPrimary) {
    const clientId = resolveContractualPartyId(chain);
    const client = clientId ? clientById.get(clientId) : null;
    chainPositionCounts.primary++;
    for (const alias of partyDoc.aliases ?? []) {
      roles.add(alias.role);
    }
    chainMemberships.push({
      chainId: String(chain._id),
      chainCode: chain.code,
      chainName: chain.name,
      clientId: clientId ?? "",
      clientName: client?.legalName ?? "",
      clientCode: client?.code ?? "",
      hubPartyId: String(partyId),
      hubPartyName: partyDoc.legalName ?? "",
      hubPartyCode: partyDoc.code ?? "",
      chainPosition: "primary",
      operationalRole: chain.primaryRole ?? "shipper",
      relationshipType: "",
      direction: chain.direction ?? "export",
      primaryRole: chain.primaryRole ?? "shipper",
      defaultIncoterm: chain.defaultIncoterm ?? "",
      defaultTransportMode: chain.defaultTransportMode ?? "",
      defaultPortOfLoading: chain.defaultPortOfLoading ?? "",
      defaultPortOfDischarge: chain.defaultPortOfDischarge ?? "",
    });
  }

  for (const chain of memberChains) {
    const clientId = resolveContractualPartyId(chain);
    const client = clientId ? clientById.get(clientId) : null;
    const network = await loadSupplyChainNetwork(companyId, chain);
    const member = (network.members ?? []).find((m) => m.party && String(m.party._id) === String(partyId));
    const hubId = network.primaryParty ? String(network.primaryParty._id) : resolvePrimaryPartyId(chain);
    const hubSnap = hubSnapshot(hubById, hubId);
    chainPositionCounts.member++;
    for (const alias of member?.party?.aliases ?? partyDoc.aliases ?? []) {
      roles.add(alias.role);
    }
    const operationalRole =
      (member?.party?.aliases ?? partyDoc.aliases ?? []).map((a) => a.role).find(Boolean) ?? "";
    chainMemberships.push({
      chainId: String(chain._id),
      chainCode: chain.code,
      chainName: chain.name,
      clientId: clientId ?? "",
      clientName: client?.legalName ?? "",
      clientCode: client?.code ?? "",
      ...hubSnap,
      chainPosition: "member",
      operationalRole,
      relationshipType: member?.relationshipType ?? relationshipFromHub(hubById.get(hubId), partyId),
      direction: chain.direction ?? "export",
      primaryRole: chain.primaryRole ?? "shipper",
    });
  }

  for (const chain of chainsLegacy) {
    if (chainsAsPrimary.some((p) => String(p._id) === String(chain._id))) continue;
    if (memberChainIds.has(String(chain._id))) continue;
    const clientId = resolveContractualPartyId(chain);
    const client = clientId ? clientById.get(clientId) : null;
    const hubId = resolvePrimaryPartyId(chain);
    const hubDoc = hubId ? hubById.get(hubId) : null;
    const hubSnap = hubSnapshot(hubById, hubId);

    for (const node of chain.nodes ?? []) {
      if (String(node.partyId) !== String(partyId)) continue;
      roles.add(node.role);
      const isPrimary = hubId ? String(hubId) === String(partyId) : false;
      chainPositionCounts[isPrimary ? "primary" : "member"]++;
      chainMemberships.push({
        chainId: String(chain._id),
        chainCode: chain.code,
        chainName: chain.name,
        clientId: clientId ?? "",
        clientName: client?.legalName ?? "",
        clientCode: client?.code ?? "",
        ...hubSnap,
        chainPosition: isPrimary ? "primary" : "member",
        operationalRole: node.role ?? "",
        relationshipType: isPrimary ? "" : relationshipFromHub(hubDoc, partyId),
        direction: chain.direction ?? "export",
        primaryRole: chain.primaryRole ?? "shipper",
      });
    }
  }

  chainMemberships.sort((a, b) => a.chainCode.localeCompare(b.chainCode));

  const relatedIds = (partyDoc.relatedParties ?? []).map((r) => r.relatedPartyId).filter(Boolean);
  const relatedDocs =
    relatedIds.length > 0
      ? await Party.find({ companyId, _id: { $in: relatedIds } })
          .select("code legalName")
          .lean()
      : [];
  const relatedById = new Map(relatedDocs.map((p) => [String(p._id), p]));

  const facilityIds = (partyDoc.relatedFacilities ?? []).map((r) => r.facilityId).filter(Boolean);
  const facilityDocs =
    facilityIds.length > 0
      ? await Facility.find({ companyId, _id: { $in: facilityIds } })
          .select("code name facilityType city country")
          .lean()
      : [];
  const facilityById = new Map(facilityDocs.map((f) => [String(f._id), f]));

  const subsidiaries = await loadPartySubsidiaries(companyId, partyId);

  const ownedSupplyChains = chainsOwned.map((chain) => {
    const hubId = resolvePrimaryPartyId(chain);
    const hub = hubId ? hubById.get(hubId) : null;
    return {
      chainId: String(chain._id),
      chainCode: chain.code,
      chainName: chain.name,
      primaryPartyId: hubId ?? "",
      primaryPartyName: hub?.legalName ?? "",
      primaryPartyCode: hub?.code ?? "",
      direction: chain.direction ?? "export",
      primaryRole: chain.primaryRole ?? "shipper",
      defaultIncoterm: chain.defaultIncoterm ?? "",
      defaultTransportMode: chain.defaultTransportMode ?? "",
      defaultPortOfLoading: chain.defaultPortOfLoading ?? "",
      defaultPortOfDischarge: chain.defaultPortOfDischarge ?? "",
    };
  });

  return {
    ...serializeParty(partyDoc),
    addressBook: (partyDoc.addressBook ?? []).map(serializePartyAddress),
    contacts: (partyDoc.contacts ?? []).map(serializePartyContact),
    aliases: (partyDoc.aliases ?? []).map(serializePartyAlias),
    relatedParties: (partyDoc.relatedParties ?? []).map((row) =>
      serializePartyRelation(row, relatedById.get(String(row.relatedPartyId)))
    ),
    relatedFacilities: (partyDoc.relatedFacilities ?? []).map((row) =>
      serializePartyFacility(row, facilityById.get(String(row.facilityId)))
    ),
    subsidiaries,
    ownedSupplyChains,
    roles: [...roles].sort(),
    chainMemberships,
    chainPositionCounts,
    sectionCounts: {
      addresses: countAddresses(partyDoc),
      contacts: partyDoc.contacts?.length ?? 0,
      relatedParties: partyDoc.relatedParties?.length ?? 0,
      relatedFacilities: partyDoc.relatedFacilities?.length ?? 0,
      aliases: partyDoc.aliases?.length ?? 0,
      supplyChains: chainMemberships.length,
      subsidiaries: subsidiaries.length,
      ownedSupplyChains: ownedSupplyChains.length,
    },
  };
}
