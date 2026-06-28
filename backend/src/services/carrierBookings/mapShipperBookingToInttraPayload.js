/**
 * INTTRA / IFTMBF-oriented payload from a persisted carrier booking request.
 */
export function mapCarrierRequestToInttraPayload(carrierRequest) {
  const equipment = (carrierRequest.equipment ?? []).map((row) => ({
    equipmentType: row.equipmentType,
    quantity: row.quantity,
    weightKg: row.weightKg ?? null,
    volumeCbm: row.volumeCbm ?? null,
    shipperOwned: row.shipperOwned === true,
  }));

  return {
    schemaVersion: "naolab.inttra.v0",
    messageType: "bookingRequest",
    requestReference: carrierRequest.requestReference,
    idempotencyKey: carrierRequest.idempotencyKey || carrierRequest.requestReference,
    sourceShipperBookingReferences: carrierRequest.shipperBookingReferences?.length
      ? carrierRequest.shipperBookingReferences
      : [carrierRequest.shipperBookingReference].filter(Boolean),
    carrier: {
      scac: carrierRequest.carrierScac,
      name: carrierRequest.carrierName,
    },
    service: {
      type: carrierRequest.serviceType ?? "FCL",
      freightPaymentTerms: carrierRequest.freightPaymentTerms ?? "",
      contractNumber: carrierRequest.contractNumber ?? "",
    },
    routing: {
      placeOfReceipt: carrierRequest.placeOfReceipt ?? "",
      portOfLoading: carrierRequest.portOfLoading ?? "",
      portOfDischarge: carrierRequest.portOfDischarge ?? "",
      placeOfDelivery: carrierRequest.placeOfDelivery ?? "",
    },
    dates: {
      cargoReadyDate: carrierRequest.cargoReadyDate ?? null,
      expectedReceiptDate: carrierRequest.expectedReceiptDate ?? null,
      expectedDeliveryDate: carrierRequest.expectedDeliveryDate ?? null,
      requestedDepartureDate: carrierRequest.requestedDepartureDate ?? null,
    },
    parties: {
      bookingParty: carrierRequest.bookingParty ?? "",
      customer: carrierRequest.customer ?? "",
      shipper: carrierRequest.shipper ?? "",
      consignee: carrierRequest.consignee ?? "",
      notifyParty: carrierRequest.notifyParty ?? "",
    },
    commercial: {
      incoterm: carrierRequest.incoterm ?? "",
      incotermLocation: carrierRequest.incotermLocation ?? "",
      customerReferenceNumber: carrierRequest.customerReferenceNumber ?? "",
    },
    cargo: {
      description: carrierRequest.cargoDescription ?? "",
      totalGrossWeightKg: carrierRequest.totalGrossWeightKg ?? null,
      totalVolumeCbm: carrierRequest.totalVolumeCbm ?? null,
      totalPackages: carrierRequest.totalPackages ?? null,
      dangerousGoods: carrierRequest.dangerousGoods === true,
    },
    equipment,
    cargoLines: (carrierRequest.cargoLines ?? []).map((line) => ({
      sourceShipperBookingReference: line.sourceShipperBookingReference ?? "",
      lineKey: line.lineKey,
      orderNumber: line.orderNumber ?? "",
      sku: line.sku,
      bookedQuantity: line.bookedQuantity,
      quantityUnit: line.quantityUnit,
      description: line.description ?? "",
      commodityCode: line.commodityCode ?? "",
      countryOfOrigin: line.countryOfOrigin ?? "",
      bookedWeight: line.bookedWeight ?? null,
      bookedVolume: line.bookedVolume ?? null,
    })),
    specialInstructions: carrierRequest.specialInstructions ?? "",
    remarks: carrierRequest.remarks ?? "",
  };
}

/** @deprecated Use mapCarrierRequestToInttraPayload */
export function mapShipperBookingToInttraPayload(carrierRequest, shipperBooking) {
  void shipperBooking;
  return mapCarrierRequestToInttraPayload(carrierRequest);
}
