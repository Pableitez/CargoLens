import { api } from "./client.js";
import type { PaginatedResponse } from "./listQuery";
import { fetchAllPages } from "./listQuery";

export type PartyRelationshipKind = "related" | "subsidiary" | "alias";

export type PartyAccountType = "operational" | "contractual_primary" | "contractual_subsidiary";

export type PartyRelationshipRow = {
  id: string;
  kind: PartyRelationshipKind;
  linkId: string;
  fromPartyId: string;
  fromPartyCode: string;
  fromPartyName: string;
  fromAccountType: PartyAccountType;
  toPartyId: string | null;
  toPartyCode: string;
  toPartyName: string;
  toAccountType: PartyAccountType | "";
  primaryRole: string;
  relationshipType: string;
  clientAlias: string;
  aliasCode: string;
  aliasRole: string;
  notes: string;
};

export type FacilityRelationshipRow = {
  id: string;
  linkId: string;
  partyId: string;
  partyCode: string;
  partyName: string;
  partyAccountType: PartyAccountType;
  facilityId: string;
  facilityCode: string;
  facilityName: string;
  facilityCity: string;
  facilityCountry: string;
  primaryRole: string;
  purpose: string;
  notes: string;
};

export type PartyRelationshipListParams = {
  q?: string;
  field?: string;
  kind?: PartyRelationshipKind | "all";
  relationshipType?: string;
  fromAccountType?: PartyAccountType | "all";
  toAccountType?: PartyAccountType | "all";
  skip?: number;
  limit?: number;
};

export type FacilityRelationshipListParams = {
  q?: string;
  field?: string;
  purpose?: string;
  partyAccountType?: PartyAccountType | "all";
  skip?: number;
  limit?: number;
};

export async function fetchPartyRelationshipsPage(params: PartyRelationshipListParams = {}) {
  const { data } = await api.get<PaginatedResponse<PartyRelationshipRow>>("/trade-relationships/parties", {
    params,
  });
  return data;
}

export async function fetchPartyRelationships(
  params: Omit<PartyRelationshipListParams, "skip" | "limit"> = {}
) {
  return fetchAllPages((skip, limit) => fetchPartyRelationshipsPage({ ...params, skip, limit }));
}

export async function fetchFacilityRelationshipsPage(params: FacilityRelationshipListParams = {}) {
  const { data } = await api.get<PaginatedResponse<FacilityRelationshipRow>>(
    "/trade-relationships/facilities",
    { params }
  );
  return data;
}

export async function fetchFacilityRelationships(
  params: Omit<FacilityRelationshipListParams, "skip" | "limit"> = {}
) {
  return fetchAllPages((skip, limit) => fetchFacilityRelationshipsPage({ ...params, skip, limit }));
}
