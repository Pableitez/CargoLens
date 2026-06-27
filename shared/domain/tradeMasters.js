export const PARTY_ROLES = Object.freeze(["shipper", "consignee", "notify", "buyer", "forwarder"]);

/** @deprecated Party nodes no longer use tier; contractual primary/subsidiary lives on Client. */
export const PARTY_TIERS = Object.freeze(["primary", "subsidiary"]);

export const CONTRACTUAL_TIERS = Object.freeze(["primary", "subsidiary"]);

export const SUPPLY_CHAIN_DIRECTIONS = Object.freeze(["export", "import", "domestic"]);

export const SUPPLY_CHAIN_PRIMARY_ROLES = Object.freeze(["shipper", "consignee"]);

export const PARTY_RELATIONSHIP_TYPES = Object.freeze([
  "parent",
  "subsidiary",
  "affiliate",
  "agent",
  "broker",
  "other",
]);

/** Allowed link types when connecting related parties (operational + corporate). */
export const PARTY_RELATED_LINK_TYPES = Object.freeze([...PARTY_ROLES, ...PARTY_RELATIONSHIP_TYPES]);

export const PARTY_ADDRESS_LABELS = Object.freeze([
  "registered",
  "billing",
  "delivery",
  "warehouse",
  "other",
]);

export const FACILITY_TYPES = Object.freeze(["warehouse", "plant", "office", "port", "other"]);

export const PARTY_FACILITY_PURPOSES = Object.freeze([
  "operates",
  "ships_from",
  "receives_at",
  "billing",
  "other",
]);

export function isValidContractualTier(value) {
  return CONTRACTUAL_TIERS.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidPartyRole(value) {
  return PARTY_ROLES.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidPartyTier(value) {
  return PARTY_TIERS.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidSupplyChainDirection(value) {
  return SUPPLY_CHAIN_DIRECTIONS.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidSupplyChainPrimaryRole(value) {
  return SUPPLY_CHAIN_PRIMARY_ROLES.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidPartyRelationshipType(value) {
  return PARTY_RELATIONSHIP_TYPES.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidRelatedPartyLinkType(value) {
  return PARTY_RELATED_LINK_TYPES.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidPartyAddressLabel(value) {
  return PARTY_ADDRESS_LABELS.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidFacilityType(value) {
  return FACILITY_TYPES.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function isValidPartyFacilityPurpose(value) {
  return PARTY_FACILITY_PURPOSES.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

export function normalizeTradeCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

/** Client-facing label for a party in a given operational role (preserves readable casing). */
export function normalizePartyClientAlias(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

/** Case-insensitive lookup key for role-scoped client aliases. */
export function partyClientAliasLookupKey(value) {
  return normalizePartyClientAlias(value).toLowerCase();
}
