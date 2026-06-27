const LEGACY_ORDER_STATUS = Object.freeze({
  confirmed: "booked",
  in_progress: "partially_booked",
  closed: "booked",
});

function normalizeOrderStatus(status) {
  const value = String(status ?? "draft");
  return LEGACY_ORDER_STATUS[value] ?? value;
}

function normalizeTransportMode(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!v) return "";
  if (v === "sea") return "ocean";
  return v;
}

function serializeLine(line) {
  return {
    lineKey: line.lineKey,
    sku: line.sku,
    description: line.description ?? "",
    quantity: line.quantity,
    uom: line.uom,
    countryOfOrigin: line.countryOfOrigin ?? "",
    totalGrossWeight: line.totalGrossWeight ?? null,
    totalCbm: line.totalCbm ?? null,
  };
}

export function serializeOrder(doc) {
  return {
    id: doc._id,
    orderNumber: doc.orderNumber ?? doc.poNumber ?? "",
    externalBusinessId: doc.externalBusinessId ?? "",
    customer: doc.customer ?? doc.contractualCustomerCode ?? "",
    shipper: doc.shipper ?? doc.shipperAliasCode ?? "",
    consignee: doc.consignee ?? doc.consigneeAliasCode ?? "",
    clientId: doc.contractualPartyId ? String(doc.contractualPartyId) : null,
    supplyChainId: doc.supplyChainId ? String(doc.supplyChainId) : null,
    operatingShipperPartyId: doc.operatingShipperPartyId ? String(doc.operatingShipperPartyId) : null,
    operatingConsigneePartyId: doc.operatingConsigneePartyId ? String(doc.operatingConsigneePartyId) : null,
    placeOfReceiptFacilityId: doc.placeOfReceiptFacilityId ? String(doc.placeOfReceiptFacilityId) : null,
    portOfLoadingFacilityId: doc.portOfLoadingFacilityId ? String(doc.portOfLoadingFacilityId) : null,
    portOfDischargeFacilityId: doc.portOfDischargeFacilityId ? String(doc.portOfDischargeFacilityId) : null,
    placeOfDeliveryFacilityId: doc.placeOfDeliveryFacilityId ? String(doc.placeOfDeliveryFacilityId) : null,
    shippingWindowStart: doc.shippingWindowStart ?? null,
    shippingWindowEnd: doc.shippingWindowEnd ?? null,
    transportMode: normalizeTransportMode(doc.transportMode),
    placeOfReceipt: doc.placeOfReceipt ?? "",
    portOfLoading: doc.portOfLoading ?? "",
    portOfDischarge: doc.portOfDischarge ?? "",
    placeOfDelivery: doc.placeOfDelivery ?? "",
    incoterm: doc.incoterm ?? "",
    status: normalizeOrderStatus(doc.status),
    lines: (doc.lines ?? []).map(serializeLine),
    notes: doc.notes ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
