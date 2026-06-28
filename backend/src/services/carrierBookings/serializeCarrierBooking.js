function serializeEquipment(row) {
  return {
    quantity: row.quantity,
    equipmentType: row.equipmentType,
    weightKg: row.weightKg ?? null,
    volumeCbm: row.volumeCbm ?? null,
    shipperOwned: row.shipperOwned === true,
  };
}

function serializeCargoLineRow(line) {
  return {
    sourceShipperBookingReference: line.sourceShipperBookingReference ?? "",
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

export function serializeCarrierBooking(doc) {
  const shipperBookingIds = (doc.shipperBookingIds ?? []).map((id) => String(id));
  const legacyId = doc.shipperBookingId ? String(doc.shipperBookingId) : null;
  const allShipperBookingIds = shipperBookingIds.length > 0 ? shipperBookingIds : legacyId ? [legacyId] : [];

  const shipperBookingReferences =
    doc.shipperBookingReferences?.length > 0
      ? doc.shipperBookingReferences
      : doc.shipperBookingReference
        ? String(doc.shipperBookingReference)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

  return {
    id: String(doc._id),
    requestReference: doc.requestReference ?? "",
    shipperBookingIds: allShipperBookingIds,
    shipperBookingId: allShipperBookingIds[0] ?? null,
    shipperBookingReferences,
    shipperBookingReference: doc.shipperBookingReference ?? shipperBookingReferences.join(", "),
    provider: doc.provider ?? "inttra",
    environment: doc.environment ?? "mock",
    carrierScac: doc.carrierScac ?? "",
    carrierName: doc.carrierName ?? "",
    serviceType: doc.serviceType ?? "FCL",
    freightPaymentTerms: doc.freightPaymentTerms ?? "",
    contractNumber: doc.contractNumber ?? "",
    status: doc.status ?? "draft",
    idempotencyKey: doc.idempotencyKey ?? "",
    externalReference: doc.externalReference ?? "",
    externalStatus: doc.externalStatus ?? "",
    inttraTransactionId: doc.inttraTransactionId ?? "",
    bookingParty: doc.bookingParty ?? "",
    customer: doc.customer ?? "",
    shipper: doc.shipper ?? "",
    consignee: doc.consignee ?? "",
    notifyParty: doc.notifyParty ?? "",
    clientId: doc.contractualPartyId ? String(doc.contractualPartyId) : null,
    supplyChainId: doc.supplyChainId ? String(doc.supplyChainId) : null,
    operatingShipperPartyId: doc.operatingShipperPartyId ? String(doc.operatingShipperPartyId) : null,
    operatingConsigneePartyId: doc.operatingConsigneePartyId ? String(doc.operatingConsigneePartyId) : null,
    placeOfReceiptFacilityId: doc.placeOfReceiptFacilityId ? String(doc.placeOfReceiptFacilityId) : null,
    portOfLoadingFacilityId: doc.portOfLoadingFacilityId ? String(doc.portOfLoadingFacilityId) : null,
    portOfDischargeFacilityId: doc.portOfDischargeFacilityId ? String(doc.portOfDischargeFacilityId) : null,
    placeOfDeliveryFacilityId: doc.placeOfDeliveryFacilityId ? String(doc.placeOfDeliveryFacilityId) : null,
    customerReferenceNumber: doc.customerReferenceNumber ?? "",
    portOfLoading: doc.portOfLoading ?? "",
    portOfDischarge: doc.portOfDischarge ?? "",
    placeOfReceipt: doc.placeOfReceipt ?? "",
    placeOfDelivery: doc.placeOfDelivery ?? "",
    cargoReadyDate: doc.cargoReadyDate ?? null,
    expectedReceiptDate: doc.expectedReceiptDate ?? null,
    expectedDeliveryDate: doc.expectedDeliveryDate ?? null,
    requestedDepartureDate: doc.requestedDepartureDate ?? null,
    incoterm: doc.incoterm ?? "",
    incotermLocation: doc.incotermLocation ?? "",
    cargoDescription: doc.cargoDescription ?? "",
    totalGrossWeightKg: doc.totalGrossWeightKg ?? null,
    totalVolumeCbm: doc.totalVolumeCbm ?? null,
    totalPackages: doc.totalPackages ?? null,
    dangerousGoods: doc.dangerousGoods === true,
    cargoLines: (doc.cargoLines ?? []).map(serializeCargoLineRow),
    equipment: (doc.equipment ?? []).map(serializeEquipment),
    specialInstructions: doc.specialInstructions ?? "",
    payloadSnapshot: doc.payloadSnapshot ?? null,
    lastResponse: doc.lastResponse ?? null,
    lastResponseSource: doc.lastResponseSource ?? "",
    submittedAt: doc.submittedAt ?? null,
    acknowledgedAt: doc.acknowledgedAt ?? null,
    confirmedAt: doc.confirmedAt ?? null,
    rejectedAt: doc.rejectedAt ?? null,
    rejectionReason: doc.rejectionReason ?? "",
    remarks: doc.remarks ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
