import type { ShipperBooking } from "../shipperBookings/types";
import { resolveLocationCode } from "../../utils/locationUtils";
import type { CarrierBookingCargoLine, CarrierBookingFormState } from "./types";

function toInputDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toInputNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return String(value);
}

function lineFromShipperBooking(
  line: ShipperBooking["lines"][number],
  sbRef: string
): CarrierBookingCargoLine {
  return {
    sourceShipperBookingReference: sbRef,
    lineKey: line.lineKey,
    orderNumber: line.orderNumber,
    sku: line.sku,
    externalBusinessId: line.externalBusinessId,
    bookedQuantity: line.bookedQuantity,
    quantityUnit: line.quantityUnit,
    bookedPackages: line.bookedPackages,
    packagesUnit: line.packagesUnit,
    bookedVolume: line.bookedVolume,
    bookedWeight: line.bookedWeight,
    description: line.description,
    countryOfOrigin: line.countryOfOrigin,
    commodityCode: line.commodityCode,
  };
}

/** Prefill CB form fields from selected shipper bookings (SB → CB). */
export function prefillCarrierBookingFromShipperBookings(
  selected: ShipperBooking[],
  prev: CarrierBookingFormState
): CarrierBookingFormState {
  if (selected.length === 0) {
    return { ...prev, shipperBookingIds: [], cargoLines: [] };
  }

  const primary = selected[0];
  const cargoLines: CarrierBookingCargoLine[] = [];
  let totalWeight = 0;
  let totalVolume = 0;
  let totalPackages = 0;
  let hasWeight = false;
  let hasVolume = false;
  let hasPackages = false;

  for (const sb of selected) {
    const sbRef = sb.bookingReference;
    for (const line of sb.lines) {
      cargoLines.push(lineFromShipperBooking(line, sbRef));
      if (line.bookedWeight != null) {
        totalWeight += line.bookedWeight;
        hasWeight = true;
      }
      if (line.bookedVolume != null) {
        totalVolume += line.bookedVolume;
        hasVolume = true;
      }
      if (line.bookedPackages != null) {
        totalPackages += line.bookedPackages;
        hasPackages = true;
      }
    }
  }

  const cargoDescription = cargoLines
    .map((line) => line.description || line.sku)
    .filter(Boolean)
    .join("; ")
    .slice(0, 500);

  return {
    ...prev,
    shipperBookingIds: selected.map((sb) => sb.id),
    contractualPartyId: primary.clientId ?? prev.contractualPartyId,
    supplyChainId: primary.supplyChainId ?? prev.supplyChainId,
    operatingShipperPartyId: primary.operatingShipperPartyId ?? prev.operatingShipperPartyId,
    operatingConsigneePartyId: primary.operatingConsigneePartyId ?? prev.operatingConsigneePartyId,
    placeOfReceiptFacilityId: primary.placeOfReceiptFacilityId ?? prev.placeOfReceiptFacilityId,
    portOfLoadingFacilityId: primary.portOfLoadingFacilityId ?? prev.portOfLoadingFacilityId,
    portOfDischargeFacilityId: primary.portOfDischargeFacilityId ?? prev.portOfDischargeFacilityId,
    placeOfDeliveryFacilityId: primary.placeOfDeliveryFacilityId ?? prev.placeOfDeliveryFacilityId,
    bookingParty: primary.customer || prev.bookingParty,
    customer: primary.customer || prev.customer,
    shipper: primary.shipper || prev.shipper,
    consignee: primary.consignee || prev.consignee,
    notifyParty: primary.consignee || prev.notifyParty,
    customerReferenceNumber: primary.customerReferenceNumber || prev.customerReferenceNumber,
    placeOfReceipt: primary.placeOfReceipt || prev.placeOfReceipt,
    portOfLoading: primary.portOfLoading || prev.portOfLoading,
    portOfDischarge: primary.portOfDischarge || prev.portOfDischarge,
    placeOfDelivery: primary.placeOfDelivery || prev.placeOfDelivery,
    cargoReadyDate: toInputDate(primary.cargoReadyDate) || prev.cargoReadyDate,
    expectedReceiptDate: toInputDate(primary.expectedReceiptDate) || prev.expectedReceiptDate,
    expectedDeliveryDate: toInputDate(primary.expectedDeliveryDate) || prev.expectedDeliveryDate,
    requestedDepartureDate: toInputDate(primary.expectedReceiptDate) || prev.requestedDepartureDate,
    incoterm: primary.incoterm || prev.incoterm,
    incotermLocation: primary.incotermLocation || prev.incotermLocation,
    remarks: primary.remarks || prev.remarks,
    cargoLines,
    cargoDescription,
    totalGrossWeightKg: hasWeight ? toInputNumber(totalWeight) : prev.totalGrossWeightKg,
    totalVolumeCbm: hasVolume ? toInputNumber(totalVolume) : prev.totalVolumeCbm,
    totalPackages: hasPackages ? toInputNumber(totalPackages) : prev.totalPackages,
  };
}

export function formFromCarrierBookingItem(
  item: import("./types").CarrierBookingRequest
): CarrierBookingFormState {
  return {
    requestReference: item.requestReference,
    shipperBookingIds: item.shipperBookingIds,
    carrierScac: item.carrierScac,
    environment: item.environment,
    provider: item.provider,
    serviceType: item.serviceType,
    freightPaymentTerms: item.freightPaymentTerms,
    contractNumber: item.contractNumber,
    bookingParty: item.bookingParty,
    customer: item.customer,
    shipper: item.shipper,
    consignee: item.consignee,
    notifyParty: item.notifyParty,
    contractualPartyId: item.clientId ?? "",
    supplyChainId: item.supplyChainId ?? "",
    operatingShipperPartyId: item.operatingShipperPartyId ?? "",
    operatingConsigneePartyId: item.operatingConsigneePartyId ?? "",
    placeOfReceiptFacilityId: item.placeOfReceiptFacilityId ?? "",
    portOfLoadingFacilityId: item.portOfLoadingFacilityId ?? "",
    portOfDischargeFacilityId: item.portOfDischargeFacilityId ?? "",
    placeOfDeliveryFacilityId: item.placeOfDeliveryFacilityId ?? "",
    customerReferenceNumber: item.customerReferenceNumber,
    portOfLoading: item.portOfLoading,
    portOfDischarge: item.portOfDischarge,
    placeOfReceipt: item.placeOfReceipt,
    placeOfDelivery: item.placeOfDelivery,
    cargoReadyDate: toInputDate(item.cargoReadyDate),
    expectedReceiptDate: toInputDate(item.expectedReceiptDate),
    expectedDeliveryDate: toInputDate(item.expectedDeliveryDate),
    requestedDepartureDate: toInputDate(item.requestedDepartureDate),
    incoterm: item.incoterm,
    incotermLocation: item.incotermLocation,
    cargoDescription: item.cargoDescription,
    totalGrossWeightKg: toInputNumber(item.totalGrossWeightKg),
    totalVolumeCbm: toInputNumber(item.totalVolumeCbm),
    totalPackages: toInputNumber(item.totalPackages),
    dangerousGoods: item.dangerousGoods,
    cargoLines: item.cargoLines,
    specialInstructions: item.specialInstructions,
    remarks: item.remarks,
    equipment:
      item.equipment.length > 0
        ? item.equipment.map((row) => ({ ...row }))
        : [{ quantity: 1, equipmentType: "40HC", weightKg: null, volumeCbm: null, shipperOwned: false }],
  };
}

export function carrierBookingFormToPayload(
  form: CarrierBookingFormState,
  options?: { usesTradeMasters?: boolean }
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    shipperBookingIds: form.shipperBookingIds,
    carrierScac: form.carrierScac,
    environment: form.environment,
    provider: form.provider,
    serviceType: form.serviceType,
    freightPaymentTerms: form.freightPaymentTerms,
    contractNumber: form.contractNumber,
    bookingParty: form.bookingParty,
    notifyParty: form.notifyParty,
    customerReferenceNumber: form.customerReferenceNumber,
    cargoReadyDate: form.cargoReadyDate || null,
    expectedReceiptDate: form.expectedReceiptDate || null,
    expectedDeliveryDate: form.expectedDeliveryDate || null,
    requestedDepartureDate: form.requestedDepartureDate || null,
    incoterm: form.incoterm,
    incotermLocation: resolveLocationCode(form.incotermLocation),
    cargoDescription: form.cargoDescription,
    totalGrossWeightKg: form.totalGrossWeightKg === "" ? null : Number(form.totalGrossWeightKg),
    totalVolumeCbm: form.totalVolumeCbm === "" ? null : Number(form.totalVolumeCbm),
    totalPackages: form.totalPackages === "" ? null : Number(form.totalPackages),
    dangerousGoods: form.dangerousGoods,
    cargoLines: form.cargoLines,
    specialInstructions: form.specialInstructions,
    remarks: form.remarks,
    equipment: form.equipment.map((row) => ({
      quantity: row.quantity,
      equipmentType: row.equipmentType,
      weightKg: row.weightKg,
      volumeCbm: row.volumeCbm,
      shipperOwned: row.shipperOwned,
    })),
  };

  if (options?.usesTradeMasters) {
    return {
      ...base,
      contractualPartyId: form.contractualPartyId.trim(),
      supplyChainId: form.supplyChainId.trim(),
      operatingShipperPartyId: form.operatingShipperPartyId.trim(),
      operatingConsigneePartyId: form.operatingConsigneePartyId.trim(),
      placeOfReceiptFacilityId: form.placeOfReceiptFacilityId.trim(),
      portOfLoadingFacilityId: form.portOfLoadingFacilityId.trim(),
      portOfDischargeFacilityId: form.portOfDischargeFacilityId.trim(),
      placeOfDeliveryFacilityId: form.placeOfDeliveryFacilityId.trim(),
    };
  }

  return {
    ...base,
    customer: form.customer,
    shipper: form.shipper,
    consignee: form.consignee,
    portOfLoading: resolveLocationCode(form.portOfLoading),
    portOfDischarge: resolveLocationCode(form.portOfDischarge),
    placeOfReceipt: resolveLocationCode(form.placeOfReceipt),
    placeOfDelivery: resolveLocationCode(form.placeOfDelivery),
  };
}
