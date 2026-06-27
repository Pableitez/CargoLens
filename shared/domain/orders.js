/** @typedef {"draft" | "new" | "partially_booked" | "booked" | "cancelled"} OrderStatus */

export const ORDER_STATUSES = Object.freeze(["draft", "new", "partially_booked", "booked", "cancelled"]);

export const MANUAL_ORDER_STATUSES = Object.freeze(["draft", "new", "cancelled"]);

export const BOOKING_DERIVED_ORDER_STATUSES = Object.freeze(["partially_booked", "booked"]);

export const ORDER_TRANSPORT_MODES = Object.freeze(["", "ocean", "rail", "truck", "air"]);

/** ICC Incoterms 2020 — official values (empty string allowed separately in forms). */
export const INCOTERMS_2020 = Object.freeze([
  "EXW",
  "FCA",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
]);

/** @param {unknown} value */
export function isValidOrderStatus(value) {
  return ORDER_STATUSES.includes(String(value ?? "").trim());
}

/** @param {unknown} status */
export function isBookingDerivedOrderStatus(status) {
  return BOOKING_DERIVED_ORDER_STATUSES.includes(String(status ?? "").trim());
}

/** @param {unknown} value */
export function isValidTransportMode(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  return ORDER_TRANSPORT_MODES.includes(v);
}

/** @param {unknown} value */
export function isValidIncoterm(value) {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!v) return true;
  return INCOTERMS_2020.includes(v);
}
