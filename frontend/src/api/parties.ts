import { api } from "./client.js";
import type { PaginatedResponse } from "./listQuery";
import { fetchAllPages } from "./listQuery";

export type PartyAddress = {
  id?: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  country: string;
  postalCode: string;
  isPrimary: boolean;
};

export type PartyContact = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  isPrimary: boolean;
};

export type PartyAlias = {
  id?: string;
  role: string;
  aliasCode: string;
  source: string;
};

export type PartyRelation = {
  id?: string;
  relatedPartyId: string;
  relatedPartyCode: string;
  relatedPartyName: string;
  relationshipType: string;
  primaryRole?: string;
  clientAlias?: string;
  notes: string;
};

export type PartyFacilityLink = {
  id?: string;
  facilityId: string;
  facilityCode: string;
  facilityName: string;
  facilityType: string;
  city: string;
  country: string;
  purpose: string;
  primaryRole?: string;
  isPrimary: boolean;
  notes: string;
};

export type Party = {
  id: string;
  code: string;
  legalName: string;
  country: string;
  city: string;
  address: string;
  vat: string;
  notes: string;
  accountTier?: "operational" | "contractual";
  contractualTier?: "primary" | "subsidiary";
  parentPartyId?: string | null;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
};

export type PartyChainMembership = {
  chainId: string;
  chainCode: string;
  chainName: string;
  clientId: string;
  clientName: string;
  clientCode: string;
  hubPartyId?: string;
  hubPartyName?: string;
  hubPartyCode?: string;
  chainPosition: "primary" | "member";
  operationalRole?: string;
  relationshipType: string;
  direction?: "export" | "import" | "domestic";
  primaryRole?: "shipper" | "consignee";
  defaultIncoterm?: string;
  defaultTransportMode?: string;
  defaultPortOfLoading?: string;
  defaultPortOfDischarge?: string;
};

export type PartySubsidiary = {
  id: string;
  code: string;
  legalName: string;
  country: string;
  vat: string;
};

export type PartyOwnedSupplyChain = {
  chainId: string;
  chainCode: string;
  chainName: string;
  primaryPartyId: string;
  primaryPartyName: string;
  primaryPartyCode: string;
  direction: "export" | "import" | "domestic";
  primaryRole: "shipper" | "consignee";
  defaultIncoterm: string;
  defaultTransportMode: string;
  defaultPortOfLoading: string;
  defaultPortOfDischarge: string;
};

export type PartyProfile = Party & {
  addressBook: PartyAddress[];
  contacts: PartyContact[];
  aliases: PartyAlias[];
  relatedParties: PartyRelation[];
  relatedFacilities: PartyFacilityLink[];
  subsidiaries: PartySubsidiary[];
  ownedSupplyChains: PartyOwnedSupplyChain[];
  roles: string[];
  chainMemberships: PartyChainMembership[];
  chainPositionCounts: {
    primary: number;
    member: number;
  };
  sectionCounts: {
    addresses: number;
    contacts: number;
    relatedParties: number;
    relatedFacilities: number;
    aliases: number;
    supplyChains: number;
    subsidiaries: number;
    ownedSupplyChains: number;
  };
};

export type PartyProfileUpdate = Partial<
  Pick<
    Party,
    | "code"
    | "legalName"
    | "country"
    | "city"
    | "address"
    | "vat"
    | "notes"
    | "accountTier"
    | "contractualTier"
    | "parentPartyId"
  >
> & {
  addressBook?: PartyAddress[];
  contacts?: PartyContact[];
  aliases?: PartyAlias[];
  relatedParties?: Array<Pick<PartyRelation, "id" | "relatedPartyId" | "relationshipType" | "notes">>;
  relatedFacilities?: Array<Pick<PartyFacilityLink, "id" | "facilityId" | "purpose" | "notes">>;
  addSubsidiaryPartyIds?: string[];
  removeSubsidiaryPartyIds?: string[];
};

export type PartyListParams = {
  q?: string;
  field?: string;
  skip?: number;
  limit?: number;
};

export async function fetchPartiesPage(params: PartyListParams = {}) {
  const { data } = await api.get<PaginatedResponse<Party>>("/parties", { params });
  return data;
}

export async function fetchParties(params: PartyListParams = {}) {
  if (params.q || params.skip !== undefined || params.limit !== undefined) {
    const page = await fetchPartiesPage(params);
    return page.items;
  }
  return fetchAllPages((skip, limit) => fetchPartiesPage({ skip, limit }));
}

export async function fetchPartyProfile(id: string) {
  const { data } = await api.get<{ item: PartyProfile }>(`/parties/${id}`);
  return data.item;
}

export type PartyCreate = Partial<Party> & {
  addressBook?: PartyAddress[];
  contacts?: PartyContact[];
  aliases?: PartyAlias[];
};

export async function createParty(body: PartyCreate) {
  const { data } = await api.post<{ item: PartyProfile }>("/parties", body);
  return data.item;
}

export type BulkCreateResult<T> = {
  items: T[];
  errors?: Array<{ index: number; message: string }>;
};

export async function createPartiesBulk(items: PartyCreate[]) {
  const { data } = await api.post<BulkCreateResult<PartyProfile>>("/parties/bulk", { items });
  return data;
}

export async function updateParty(id: string, body: PartyProfileUpdate) {
  const { data } = await api.patch<{ item: PartyProfile }>(`/parties/${id}`, body);
  return data.item;
}

export async function removeParty(id: string) {
  await api.delete(`/parties/${id}`);
}
