/**
 * Party BE codes for demo seeds (9 chars: 2 ISO country + 5 name key + 2 function).
 * @see shared/domain/beCode.js
 */
export const DEMO_CLIENT_BE = {
  PENINSULA: "ESPENINHQ",
  PENINSULA_CAN: "ESCANARBR",
  ONE_ES: "ESOCEANHQ",
  CMA_VAL: "ESCMACGHQ",
  HAM_SUD: "ESHAMSUHQ",
  FAN_MED: "ESFANCAHQ",
  BSKY: "ESBLUESHQ",
  TEX_TCKU: "ESTEXFEHQ",
  FLORENS: "USFLRENHQ",
  TEXT_TNU: "USTEXTAHQ",
  GAO_CL: "USGAOCLHQ",
  SEACO_ES: "ESSEACOHQ",
  HASCON: "NLHASCOHQ",
  BEACON: "GBBEACOHQ",
  SUD_ATL: "ESSUDATHQ",
  TRITON: "USTRITOHQ",
  CLI_DEMO: "ESDEMOUHQ",
  ACME: "USACMERHQ",
  ACME_ES: "ESACIBEBR",
  NORDIC: "SENORDIHQ",
};

export const DEMO_PARTY_BE = {
  SHIPPER_VAL: "ESACMEVPL",
  CONSIGNEE_RTM: "NLROTTRDC",
  FORWARDER: "ESFREIGOF",
  BUYER_NYC: "USATLANHQ",
  CONSIGNEE_NYC: "USATLARWH",
  PEN_SHIPPER: "ESVALENWH",
  PEN_CONSIGNEE: "NLROTTDDC",
};

export const DEMO_FACILITY_CODES = ["ESVALWHS", "NLRTMDCX", "USNYCOFC"];

/** Legacy demo prefixes cleaned up on re-seed. */
export const DEMO_LEGACY_PARTY_CODE_PATTERN = /^DEMO-/;

export const ALL_DEMO_FLOW_PARTY_CODES = [...Object.values(DEMO_CLIENT_BE), ...Object.values(DEMO_PARTY_BE)];

/** @deprecated legacy codes replaced on enrichLegacyClients */
export const DEMO_LEGACY_CLIENT_CODES = [
  "PENINSULA",
  "PENINSULA-CAN",
  "ONE-ES",
  "CMA-VAL",
  "HAM-SUD",
  "FAN-MED",
  "BSKY",
  "TEX-TCKU",
  "FLORENS",
  "TEXT-TNU",
  "GAO-CL",
  "SEACO-ES",
  "HASCON",
  "BEACON",
  "SUD-ATL",
  "TRITON",
  "CLI-DEMO",
];

export const DEMO_CLIENT_CONTRACT_BY_NAME = {
  "Distribuidora Peninsular S.A.": { code: DEMO_CLIENT_BE.PENINSULA, tier: "primary" },
  "Ocean Network Express Spain": { code: DEMO_CLIENT_BE.ONE_ES, tier: "primary" },
  "Hub CMA CGM Valencia": { code: DEMO_CLIENT_BE.CMA_VAL, tier: "primary" },
  "Hamburg Süd Iberia": { code: DEMO_CLIENT_BE.HAM_SUD, tier: "primary" },
  "Fan Cargo Mediterranean": { code: DEMO_CLIENT_BE.FAN_MED, tier: "primary" },
  "Blue Sky Logistics": { code: DEMO_CLIENT_BE.BSKY, tier: "primary" },
  "TEX Feedering — TCKU": { code: DEMO_CLIENT_BE.TEX_TCKU, tier: "primary" },
  "Florens pool": { code: DEMO_CLIENT_BE.FLORENS, tier: "primary" },
  "Textainer TCNU": { code: DEMO_CLIENT_BE.TEXT_TNU, tier: "primary" },
  "GAO Container Lines": { code: DEMO_CLIENT_BE.GAO_CL, tier: "primary" },
  "Seaco Iberia": { code: DEMO_CLIENT_BE.SEACO_ES, tier: "primary" },
  "Hascon Warehousing": { code: DEMO_CLIENT_BE.HASCON, tier: "primary" },
  "Beacon Trading": { code: DEMO_CLIENT_BE.BEACON, tier: "primary" },
  "Sud Atlantic Lines": { code: DEMO_CLIENT_BE.SUD_ATL, tier: "primary" },
  "Triton Equipment Pool": { code: DEMO_CLIENT_BE.TRITON, tier: "primary" },
  "Cliente demo": { code: DEMO_CLIENT_BE.CLI_DEMO, tier: "primary" },
};

export const DEMO_EXTRA_CLIENTS = [
  {
    name: "Distribuidora Peninsular — Canarias",
    code: DEMO_CLIENT_BE.PENINSULA_CAN,
    tier: "subsidiary",
    parentName: "Distribuidora Peninsular S.A.",
    preferredInvite: "CDEMOPC1",
  },
];

export const DEMO_ORDER_CUSTOMER_CODES = {
  "Distribuidora Peninsular S.A.": DEMO_CLIENT_BE.PENINSULA,
  "Ocean Network Express Spain": DEMO_CLIENT_BE.ONE_ES,
  "Hub CMA CGM Valencia": DEMO_CLIENT_BE.CMA_VAL,
  "Hamburg Süd Iberia": DEMO_CLIENT_BE.HAM_SUD,
  "Acme Retail Group": DEMO_CLIENT_BE.ACME,
};
