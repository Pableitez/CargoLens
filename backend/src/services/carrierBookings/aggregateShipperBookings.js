function serializeCargoLine(line, sourceShipperBookingReference = "") {
  return {
    sourceShipperBookingReference: line.sourceShipperBookingReference ?? sourceShipperBookingReference ?? "",
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

/**
 * Build INTTRA-oriented defaults from one or more shipper bookings (SB → CB prefill).
 * @param {Record<string, unknown>[]} shipperBookings
 */
export function aggregateShipperBookingsForCarrierBooking(shipperBookings) {
  if (!Array.isArray(shipperBookings) || shipperBookings.length === 0) {
    throw new Error("At least one shipper booking is required.");
  }

  const primary = shipperBookings[0];
  const cargoLines = [];

  for (const sb of shipperBookings) {
    const sbRef = sb.bookingReference ?? "";
    for (const line of sb.lines ?? []) {
      cargoLines.push(serializeCargoLine(line, sbRef));
    }
  }

  let totalGrossWeightKg = 0;
  let totalVolumeCbm = 0;
  let totalPackages = 0;
  let hasWeight = false;
  let hasVolume = false;
  let hasPackages = false;

  for (const line of cargoLines) {
    if (line.bookedWeight != null) {
      totalGrossWeightKg += Number(line.bookedWeight) || 0;
      hasWeight = true;
    }
    if (line.bookedVolume != null) {
      totalVolumeCbm += Number(line.bookedVolume) || 0;
      hasVolume = true;
    }
    if (line.bookedPackages != null) {
      totalPackages += Number(line.bookedPackages) || 0;
      hasPackages = true;
    }
  }

  const cargoDescription = cargoLines
    .map((line) => line.description || line.sku)
    .filter(Boolean)
    .join("; ")
    .slice(0, 500);

  const references = shipperBookings.map((sb) => sb.bookingReference ?? "").filter(Boolean);

  return {
    shipperBookingIds: shipperBookings.map((sb) => sb._id),
    shipperBookingReferences: references,
    shipperBookingReference: references.join(", "),
    bookingParty: primary.customer ?? "",
    customer: primary.customer ?? "",
    shipper: primary.shipper ?? "",
    consignee: primary.consignee ?? "",
    notifyParty: primary.consignee ?? "",
    contractualPartyId: primary.contractualPartyId ?? null,
    supplyChainId: primary.supplyChainId ?? null,
    operatingShipperPartyId: primary.operatingShipperPartyId ?? null,
    operatingConsigneePartyId: primary.operatingConsigneePartyId ?? null,
    placeOfReceiptFacilityId: primary.placeOfReceiptFacilityId ?? null,
    portOfLoadingFacilityId: primary.portOfLoadingFacilityId ?? null,
    portOfDischargeFacilityId: primary.portOfDischargeFacilityId ?? null,
    placeOfDeliveryFacilityId: primary.placeOfDeliveryFacilityId ?? null,
    customerReferenceNumber: primary.customerReferenceNumber ?? "",
    placeOfReceipt: primary.placeOfReceipt ?? "",
    portOfLoading: primary.portOfLoading ?? "",
    portOfDischarge: primary.portOfDischarge ?? "",
    placeOfDelivery: primary.placeOfDelivery ?? "",
    cargoReadyDate: primary.cargoReadyDate ?? null,
    expectedReceiptDate: primary.expectedReceiptDate ?? null,
    expectedDeliveryDate: primary.expectedDeliveryDate ?? null,
    requestedDepartureDate: primary.expectedReceiptDate ?? null,
    incoterm: primary.incoterm ?? "",
    incotermLocation: primary.incotermLocation ?? "",
    cargoDescription,
    totalGrossWeightKg: hasWeight ? totalGrossWeightKg : null,
    totalVolumeCbm: hasVolume ? totalVolumeCbm : null,
    totalPackages: hasPackages ? totalPackages : null,
    cargoLines,
    remarks: primary.remarks ?? "",
  };
}

export { serializeCargoLine };
