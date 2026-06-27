import type { OrderBookableLine, OrderBookableSummary } from "../orders/types";
import type {
  ShipperBookingFormState,
  ShipperBookingLineFormState,
  ShipperBookingTransportMode,
} from "./types";

function toInputDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function pickField(current: string, incoming: string, merge: boolean): string {
  if (!merge) return incoming || current;
  return current.trim() ? current : incoming;
}

function buildCustomerReference(orders: OrderBookableSummary[]): string {
  if (orders.length === 0) return "";
  if (orders.length === 1) {
    const order = orders[0];
    return order.externalBusinessId.trim() || order.orderNumber;
  }
  return orders.map((order) => order.orderNumber).join(", ");
}

export function scaledLineMeasure(
  total: number | null,
  orderedQuantity: number,
  bookedQuantity: number
): string {
  if (total == null || orderedQuantity <= 0 || bookedQuantity <= 0) return "";
  const scaled = (total * bookedQuantity) / orderedQuantity;
  if (!Number.isFinite(scaled)) return "";
  return String(Math.round(scaled * 1000) / 1000);
}

export function prefillBookingFormFromOrders(
  form: ShipperBookingFormState,
  orders: OrderBookableSummary[],
  options: { merge?: boolean } = {}
): ShipperBookingFormState {
  if (orders.length === 0) return form;

  const merge = options.merge ?? true;
  const primary = orders[0];
  const customerReference = buildCustomerReference(orders);
  const cargoReady = toInputDate(primary.shippingWindowStart);
  const expectedDelivery = toInputDate(primary.shippingWindowEnd);

  const next = {
    ...form,
    customer: pickField(form.customer, primary.customer, merge),
    shipper: pickField(form.shipper, primary.shipper, merge),
    consignee: pickField(form.consignee, primary.consignee, merge),
    contractualPartyId: pickField(form.contractualPartyId, primary.clientId ?? "", merge),
    supplyChainId: pickField(form.supplyChainId, primary.supplyChainId ?? "", merge),
    operatingShipperPartyId: pickField(
      form.operatingShipperPartyId,
      primary.operatingShipperPartyId ?? "",
      merge
    ),
    operatingConsigneePartyId: pickField(
      form.operatingConsigneePartyId,
      primary.operatingConsigneePartyId ?? "",
      merge
    ),
    customerReferenceNumber: pickField(form.customerReferenceNumber, customerReference, merge),
    cargoReadyDate: pickField(form.cargoReadyDate, cargoReady, merge),
    expectedReceiptDate: pickField(form.expectedReceiptDate, cargoReady, merge),
    expectedDeliveryDate: pickField(form.expectedDeliveryDate, expectedDelivery, merge),
    transportMode: (pickField(form.transportMode, primary.transportMode, merge) ||
      "") as ShipperBookingTransportMode,
    placeOfReceipt: pickField(form.placeOfReceipt, primary.placeOfReceipt, merge),
    portOfLoading: pickField(form.portOfLoading, primary.portOfLoading, merge),
    portOfDischarge: pickField(form.portOfDischarge, primary.portOfDischarge, merge),
    placeOfDelivery: pickField(form.placeOfDelivery, primary.placeOfDelivery, merge),
    placeOfReceiptFacilityId: pickField(
      form.placeOfReceiptFacilityId,
      primary.placeOfReceiptFacilityId ?? "",
      merge
    ),
    portOfLoadingFacilityId: pickField(
      form.portOfLoadingFacilityId,
      primary.portOfLoadingFacilityId ?? "",
      merge
    ),
    portOfDischargeFacilityId: pickField(
      form.portOfDischargeFacilityId,
      primary.portOfDischargeFacilityId ?? "",
      merge
    ),
    placeOfDeliveryFacilityId: pickField(
      form.placeOfDeliveryFacilityId,
      primary.placeOfDeliveryFacilityId ?? "",
      merge
    ),
    incoterm: pickField(form.incoterm, primary.incoterm, merge),
  };

  if (!merge) {
    if (primary.customer.trim()) next.customer = primary.customer;
    if (primary.shipper.trim()) next.shipper = primary.shipper;
    if (primary.consignee.trim()) next.consignee = primary.consignee;
    if (primary.clientId) next.contractualPartyId = primary.clientId;
    if (primary.supplyChainId) next.supplyChainId = primary.supplyChainId;
    if (primary.operatingShipperPartyId) next.operatingShipperPartyId = primary.operatingShipperPartyId;
    if (primary.operatingConsigneePartyId) next.operatingConsigneePartyId = primary.operatingConsigneePartyId;
    if (customerReference.trim()) next.customerReferenceNumber = customerReference;
    if (cargoReady) {
      next.cargoReadyDate = cargoReady;
      next.expectedReceiptDate = cargoReady;
    }
    if (expectedDelivery) next.expectedDeliveryDate = expectedDelivery;
    if (primary.transportMode) next.transportMode = primary.transportMode as ShipperBookingTransportMode;
    if (primary.placeOfReceipt.trim()) next.placeOfReceipt = primary.placeOfReceipt;
    if (primary.portOfLoading.trim()) next.portOfLoading = primary.portOfLoading;
    if (primary.portOfDischarge.trim()) next.portOfDischarge = primary.portOfDischarge;
    if (primary.placeOfDelivery.trim()) next.placeOfDelivery = primary.placeOfDelivery;
    if (primary.placeOfReceiptFacilityId) next.placeOfReceiptFacilityId = primary.placeOfReceiptFacilityId;
    if (primary.portOfLoadingFacilityId) next.portOfLoadingFacilityId = primary.portOfLoadingFacilityId;
    if (primary.portOfDischargeFacilityId) next.portOfDischargeFacilityId = primary.portOfDischargeFacilityId;
    if (primary.placeOfDeliveryFacilityId) next.placeOfDeliveryFacilityId = primary.placeOfDeliveryFacilityId;
    if (primary.incoterm.trim()) next.incoterm = primary.incoterm;
  }

  return next;
}

export function bookableLineToFormState(
  orderNumber: string,
  row: OrderBookableLine,
  orderExternalBusinessId = ""
): ShipperBookingLineFormState {
  const bookedQuantity = row.remainingQuantity;

  return {
    lineKey: row.lineKey,
    orderNumber,
    sku: row.sku,
    externalBusinessId: orderExternalBusinessId,
    bookedQuantity: String(bookedQuantity),
    maxBookedQuantity: String(bookedQuantity),
    quantityUnit: row.uom,
    bookedVolume: scaledLineMeasure(row.totalCbm, row.orderedQuantity, bookedQuantity),
    bookedWeight: scaledLineMeasure(row.totalGrossWeight, row.orderedQuantity, bookedQuantity),
    description: row.description,
    countryOfOrigin: row.countryOfOrigin,
  };
}
