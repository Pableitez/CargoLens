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
    orderNumber: line.orderNumber ?? "",
    sku: line.sku,
    externalBusinessId: line.externalBusinessId ?? "",
    bookedQuantity: line.bookedQuantity,
    quantityUnit: line.quantityUnit,
    bookedPackages: line.bookedPackages ?? null,
    packagesUnit: line.packagesUnit ?? "",
    bookedVolume: line.bookedVolume ?? null,
    bookedWeight: line.bookedWeight ?? null,
    description: line.description ?? "",
    countryOfOrigin: line.countryOfOrigin ?? "",
    commodityCode: line.commodityCode ?? "",
  };
}

export function serializeShipperBooking(doc, { linkedCarrierBookingSummary = null } = {}) {
  return {
    id: doc._id,
    bookingReference: doc.bookingReference ?? "",
    customerReferenceNumber: doc.customerReferenceNumber ?? "",
    customer: doc.customer ?? "",
    shipper: doc.shipper ?? "",
    consignee: doc.consignee ?? "",
    cargoReadyDate: doc.cargoReadyDate ?? null,
    expectedReceiptDate: doc.expectedReceiptDate ?? null,
    expectedDeliveryDate: doc.expectedDeliveryDate ?? null,
    transportMode: normalizeTransportMode(doc.transportMode),
    placeOfReceipt: doc.placeOfReceipt ?? "",
    portOfLoading: doc.portOfLoading ?? "",
    portOfDischarge: doc.portOfDischarge ?? "",
    placeOfDelivery: doc.placeOfDelivery ?? "",
    incoterm: doc.incoterm ?? "",
    incotermLocation: doc.incotermLocation ?? "",
    status: doc.status ?? "draft",
    lines: (doc.lines ?? []).map(serializeLine),
    clientId: doc.contractualPartyId ? String(doc.contractualPartyId) : null,
    supplyChainId: doc.supplyChainId ? String(doc.supplyChainId) : null,
    operatingShipperPartyId: doc.operatingShipperPartyId ? String(doc.operatingShipperPartyId) : null,
    operatingConsigneePartyId: doc.operatingConsigneePartyId ? String(doc.operatingConsigneePartyId) : null,
    placeOfReceiptFacilityId: doc.placeOfReceiptFacilityId ? String(doc.placeOfReceiptFacilityId) : null,
    portOfLoadingFacilityId: doc.portOfLoadingFacilityId ? String(doc.portOfLoadingFacilityId) : null,
    portOfDischargeFacilityId: doc.portOfDischargeFacilityId ? String(doc.portOfDischargeFacilityId) : null,
    placeOfDeliveryFacilityId: doc.placeOfDeliveryFacilityId ? String(doc.placeOfDeliveryFacilityId) : null,
    remarks: doc.remarks ?? "",
    linkedCarrierBookingSummary,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
