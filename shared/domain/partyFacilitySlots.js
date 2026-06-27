/** Location slots on orders / shipper bookings — shipper-side vs consignee-side only. */
export const ORDER_FACILITY_SLOTS = Object.freeze([
  "placeOfReceipt",
  "portOfLoading",
  "portOfDischarge",
  "placeOfDelivery",
]);

/** Which party's linked facilities may fill each slot (same pool for all slots on that side). */
export const ORDER_FACILITY_SLOT_PARTY_SIDE = Object.freeze({
  placeOfReceipt: "shipper",
  portOfLoading: "shipper",
  portOfDischarge: "consignee",
  placeOfDelivery: "consignee",
});

export function partySideForFacilitySlot(slot) {
  return ORDER_FACILITY_SLOT_PARTY_SIDE[slot] ?? null;
}

export function facilityIdFieldForSlot(slot) {
  return `${slot}FacilityId`;
}

export function isOrderFacilitySlot(value) {
  return ORDER_FACILITY_SLOTS.includes(String(value ?? "").trim());
}

export function slotsForPartySide(partySide) {
  return ORDER_FACILITY_SLOTS.filter((slot) => ORDER_FACILITY_SLOT_PARTY_SIDE[slot] === partySide);
}
