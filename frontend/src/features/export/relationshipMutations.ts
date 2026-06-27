import * as partiesApi from "../../api/parties";
import type { FacilityRelationshipRow, PartyRelationshipRow } from "../../api/tradeRelationships";

export async function removePartyRelationshipRow(row: PartyRelationshipRow) {
  if (row.kind === "subsidiary" && row.toPartyId) {
    await partiesApi.updateParty(row.fromPartyId, { removeSubsidiaryPartyIds: [row.toPartyId] });
    return;
  }

  const profile = await partiesApi.fetchPartyProfile(row.fromPartyId);

  if (row.kind === "related") {
    await partiesApi.updateParty(row.fromPartyId, {
      relatedParties: profile.relatedParties
        .filter((item) => item.id !== row.linkId)
        .map((item) => ({
          id: item.id,
          relatedPartyId: item.relatedPartyId,
          relationshipType: item.relationshipType,
          primaryRole: item.primaryRole ?? "",
          clientAlias: item.clientAlias ?? "",
          notes: item.notes,
        })),
    });
    return;
  }

  if (row.kind === "alias") {
    await partiesApi.updateParty(row.fromPartyId, {
      aliases: profile.aliases
        .filter((item) => item.id !== row.linkId)
        .map((item) => ({
          id: item.id,
          role: item.role,
          aliasCode: item.aliasCode,
          source: item.source ?? "",
        })),
    });
  }
}

export async function removeFacilityRelationshipRow(row: FacilityRelationshipRow) {
  const profile = await partiesApi.fetchPartyProfile(row.partyId);
  await partiesApi.updateParty(row.partyId, {
    relatedFacilities: (profile.relatedFacilities ?? [])
      .filter((item) => item.id !== row.linkId)
      .map((item) => ({
        id: item.id,
        facilityId: item.facilityId,
        purpose: item.purpose,
        primaryRole: item.primaryRole ?? "",
        notes: item.notes,
      })),
  });
}

export type PartyRelationshipFormInput = {
  kind: "related" | "subsidiary" | "alias";
  fromPartyId: string;
  toPartyId: string;
  primaryRole: string;
  relationshipType: string;
  clientAlias: string;
  aliasRole: string;
  aliasCode: string;
  notes: string;
  linkId?: string;
};

export type FacilityRelationshipFormInput = {
  partyId: string;
  facilityId: string;
  primaryRole: string;
  purpose: string;
  notes: string;
  linkId?: string;
};

export async function savePartyRelationshipForm(input: PartyRelationshipFormInput) {
  if (input.kind === "subsidiary") {
    if (input.linkId) return;
    await partiesApi.updateParty(input.fromPartyId, {
      addSubsidiaryPartyIds: [input.toPartyId],
    });
    return;
  }

  const profile = await partiesApi.fetchPartyProfile(input.fromPartyId);

  if (input.kind === "related") {
    const nextRow = {
      relatedPartyId: input.toPartyId,
      relationshipType: input.relationshipType,
      primaryRole: input.primaryRole,
      clientAlias: input.clientAlias.trim(),
      notes: input.notes,
    };

    if (!input.linkId) {
      const alreadySubsidiary = (profile.subsidiaries ?? []).some((row) => row.id === input.toPartyId);
      if (!alreadySubsidiary) {
        await partiesApi.updateParty(input.fromPartyId, {
          addSubsidiaryPartyIds: [input.toPartyId],
        });
      }
    }

    const relatedParties = input.linkId
      ? profile.relatedParties.map((item) =>
          item.id === input.linkId
            ? { id: item.id, ...nextRow }
            : {
                id: item.id,
                relatedPartyId: item.relatedPartyId,
                relationshipType: item.relationshipType,
                primaryRole: item.primaryRole ?? "",
                clientAlias: item.clientAlias ?? "",
                notes: item.notes,
              }
        )
      : [...profile.relatedParties, nextRow];

    await partiesApi.updateParty(input.fromPartyId, { relatedParties });
    return;
  }

  const nextAlias = {
    role: input.aliasRole,
    aliasCode: input.aliasCode.trim(),
    source: input.notes,
  };
  const aliases = input.linkId
    ? profile.aliases.map((item) =>
        item.id === input.linkId
          ? { id: item.id, ...nextAlias }
          : { id: item.id, role: item.role, aliasCode: item.aliasCode, source: item.source ?? "" }
      )
    : [...profile.aliases, nextAlias];

  await partiesApi.updateParty(input.fromPartyId, { aliases });
}

export async function saveFacilityRelationshipForm(input: FacilityRelationshipFormInput) {
  const profile = await partiesApi.fetchPartyProfile(input.partyId);
  const nextRow = {
    facilityId: input.facilityId,
    purpose: input.purpose,
    primaryRole: input.primaryRole,
    notes: input.notes,
  };
  const relatedFacilities = input.linkId
    ? (profile.relatedFacilities ?? []).map((item) =>
        item.id === input.linkId
          ? { id: item.id, ...nextRow }
          : {
              id: item.id,
              facilityId: item.facilityId,
              purpose: item.purpose,
              primaryRole: item.primaryRole ?? "",
              notes: item.notes,
            }
      )
    : [...(profile.relatedFacilities ?? []), nextRow];

  await partiesApi.updateParty(input.partyId, { relatedFacilities });
}
