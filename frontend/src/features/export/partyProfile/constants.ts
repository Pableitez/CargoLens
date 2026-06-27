import * as partiesApi from "../../../api/parties";

export type ProfileSection =
  | "identity"
  | "subsidiaries"
  | "chains"
  | "addresses"
  | "contacts"
  | "facilities"
  | "related";

export const PARTY_ROLES = ["shipper", "consignee", "notify", "buyer", "forwarder"] as const;
export const ADDRESS_LABELS = ["registered", "billing", "delivery", "warehouse", "other"] as const;
export const CORPORATE_RELATION_TYPES = [
  "parent",
  "subsidiary",
  "affiliate",
  "agent",
  "broker",
  "other",
] as const;
export const FACILITY_PURPOSES = ["operates", "ships_from", "receives_at", "billing", "other"] as const;

export const EMPTY_ADDRESS: partiesApi.PartyAddress = {
  label: "registered",
  line1: "",
  line2: "",
  city: "",
  country: "",
  postalCode: "",
  isPrimary: false,
};

export const EMPTY_CONTACT: partiesApi.PartyContact = {
  name: "",
  email: "",
  phone: "",
  jobTitle: "",
  isPrimary: false,
};

export const EMPTY_RELATION = {
  relationshipType: "consignee",
  clientAlias: "",
  notes: "",
};

export const EMPTY_FACILITY_LINK = {
  purpose: "operates",
  notes: "",
};

export type ClientRow = {
  id: string;
  name: string;
  code: string;
  contractualTier?: string;
};

export type HubChainForm = {
  clientId: string;
  primaryPartyId: string;
  code: string;
  name: string;
  direction: "export" | "import" | "domestic";
  primaryRole: "shipper" | "consignee";
  defaultIncoterm: string;
  defaultTransportMode: string;
  defaultPortOfLoading: string;
  defaultPortOfDischarge: string;
};

export const EMPTY_CHAIN: HubChainForm = {
  clientId: "",
  primaryPartyId: "",
  code: "",
  name: "",
  direction: "export",
  primaryRole: "shipper",
  defaultIncoterm: "",
  defaultTransportMode: "",
  defaultPortOfLoading: "",
  defaultPortOfDischarge: "",
};
