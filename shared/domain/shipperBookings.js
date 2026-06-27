/** @typedef {"draft" | "new" | "confirmed" | "cancelled"} ShipperBookingStatus */

export const SHIPPER_BOOKING_STATUSES = Object.freeze(["draft", "new", "confirmed", "cancelled"]);

/** @param {unknown} value */
export function isValidShipperBookingStatus(value) {
  return SHIPPER_BOOKING_STATUSES.includes(String(value ?? "").trim());
}
