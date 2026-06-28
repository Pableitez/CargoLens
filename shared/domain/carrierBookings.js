/** @typedef {"draft" | "submitted" | "acknowledged" | "confirmed" | "rejected" | "cancelled" | "failed"} CarrierBookingStatus */

/** @typedef {"mock" | "inttra"} CarrierBookingProvider */

/** @typedef {"mock" | "sandbox" | "production"} CarrierBookingEnvironment */

export const CARRIER_BOOKING_STATUSES = Object.freeze([
  "draft",
  "submitted",
  "acknowledged",
  "confirmed",
  "rejected",
  "cancelled",
  "failed",
]);

export const CARRIER_BOOKING_PROVIDERS = Object.freeze(["mock", "inttra"]);

export const CARRIER_BOOKING_ENVIRONMENTS = Object.freeze(["mock", "sandbox", "production"]);

export const CARRIER_BOOKING_MODES = Object.freeze(["mock", "inttra"]);

/** Common ocean carrier SCAC codes (INTTRA / industry). */
export const CARRIER_SCAC_CODES = Object.freeze([
  { scac: "CMDU", name: "CMA CGM" },
  { scac: "MAEU", name: "Maersk" },
  { scac: "MSCU", name: "MSC" },
  { scac: "HLCU", name: "Hapag-Lloyd" },
  { scac: "COSU", name: "COSCO" },
  { scac: "ONEY", name: "ONE" },
  { scac: "EGLV", name: "Evergreen" },
  { scac: "YMLU", name: "Yang Ming" },
  { scac: "HDMU", name: "HMM" },
  { scac: "ZIMU", name: "ZIM" },
]);

export const CONTAINER_EQUIPMENT_TYPES = Object.freeze([
  "20GP",
  "40GP",
  "40HC",
  "45HC",
  "20RF",
  "40RF",
  "20OT",
  "40OT",
  "20FR",
  "40FR",
]);

/** INTTRA freight payment (IFTMBF). */
export const CARRIER_FREIGHT_PAYMENT_TERMS = Object.freeze(["", "prepaid", "collect"]);

/** INTTRA service type. */
export const CARRIER_SERVICE_TYPES = Object.freeze(["FCL", "LCL"]);

/** @param {unknown} value */
export function isValidCarrierFreightPaymentTerm(value) {
  return CARRIER_FREIGHT_PAYMENT_TERMS.includes(
    String(value ?? "")
      .trim()
      .toLowerCase()
  );
}

/** @param {unknown} value */
export function isValidCarrierServiceType(value) {
  return CARRIER_SERVICE_TYPES.includes(
    String(value ?? "")
      .trim()
      .toUpperCase()
  );
}

/** @param {unknown} value */
export function isValidCarrierBookingStatus(value) {
  return CARRIER_BOOKING_STATUSES.includes(String(value ?? "").trim());
}

/** @param {unknown} value */
export function isValidCarrierBookingProvider(value) {
  return CARRIER_BOOKING_PROVIDERS.includes(String(value ?? "").trim());
}

/** @param {unknown} value */
export function isValidCarrierBookingEnvironment(value) {
  return CARRIER_BOOKING_ENVIRONMENTS.includes(String(value ?? "").trim());
}

/** @param {unknown} scac */
export function normalizeCarrierScac(scac) {
  return String(scac ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 4);
}

/** @param {unknown} scac */
export function carrierNameFromScac(scac) {
  const key = normalizeCarrierScac(scac);
  const row = CARRIER_SCAC_CODES.find((c) => c.scac === key);
  return row?.name ?? key;
}
