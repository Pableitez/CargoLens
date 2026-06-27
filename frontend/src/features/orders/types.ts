import {
  INCOTERMS_2020,
  isBookingDerivedOrderStatus as sharedIsBookingDerivedOrderStatus,
  MANUAL_ORDER_STATUSES,
  ORDER_STATUSES,
  ORDER_TRANSPORT_MODES as SHARED_ORDER_TRANSPORT_MODES,
} from "@shared/domain/orders.js";

export type OrderEventKind = "created" | "status_change" | "note" | "milestone" | "import";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderTransportMode = (typeof SHARED_ORDER_TRANSPORT_MODES)[number];

export type Incoterm = "" | (typeof INCOTERMS_2020)[number];

export type OrderLine = {
  lineKey: string;
  sku: string;
  description: string;
  quantity: number;
  uom: string;
  countryOfOrigin: string;
  totalGrossWeight: number | null;
  totalCbm: number | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  externalBusinessId: string;
  customer: string;
  shipper: string;
  consignee: string;
  clientId: string | null;
  supplyChainId: string | null;
  operatingShipperPartyId: string | null;
  operatingConsigneePartyId: string | null;
  placeOfReceiptFacilityId: string | null;
  portOfLoadingFacilityId: string | null;
  portOfDischargeFacilityId: string | null;
  placeOfDeliveryFacilityId: string | null;
  shippingWindowStart: string | null;
  shippingWindowEnd: string | null;
  transportMode: OrderTransportMode;
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  incoterm: string;
  status: OrderStatus;
  lines: OrderLine[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderEvent = {
  id: string;
  kind: OrderEventKind;
  message: string;
  actorEmail: string;
  visibleToClient: boolean;
  meta: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
};

export type OrderFormState = {
  orderNumber: string;
  externalBusinessId: string;
  customer: string;
  shipper: string;
  consignee: string;
  contractualPartyId: string;
  supplyChainId: string;
  operatingShipperPartyId: string;
  operatingConsigneePartyId: string;
  shippingWindowStart: string;
  shippingWindowEnd: string;
  transportMode: OrderTransportMode;
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  placeOfReceiptFacilityId: string;
  portOfLoadingFacilityId: string;
  portOfDischargeFacilityId: string;
  placeOfDeliveryFacilityId: string;
  incoterm: string;
  status: OrderStatus;
  notes: string;
};

export type OrderLineFormState = {
  lineKey: string;
  sku: string;
  description: string;
  quantity: string;
  uom: string;
  countryOfOrigin: string;
  totalGrossWeight: string;
  totalCbm: string;
};

export type OrderImportPreview = {
  ok: boolean;
  sheet: string;
  rowsTotal: number;
  valid: number;
  invalid: number;
  usesTradeMasters?: boolean;
  preview: {
    rowNumber: number;
    orderNumber: string;
    lineKey: string;
    errors: string[];
    valid: boolean;
  }[];
  errors: string[];
};

export type OrderImportResult = {
  ok: boolean;
  sheet: string;
  rowsTotal: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export type OrderBookableLine = {
  lineKey: string;
  sku: string;
  description: string;
  orderedQuantity: number;
  uom: string;
  countryOfOrigin: string;
  totalGrossWeight: number | null;
  totalCbm: number | null;
  bookedQuantity: number;
  remainingQuantity: number;
  fullyBooked: boolean;
  bookable: boolean;
};

export type OrderBookableSummary = {
  id: string;
  orderNumber: string;
  externalBusinessId: string;
  customer: string;
  shipper: string;
  consignee: string;
  clientId: string | null;
  supplyChainId: string | null;
  operatingShipperPartyId: string | null;
  operatingConsigneePartyId: string | null;
  status: OrderStatus;
  transportMode: OrderTransportMode;
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  placeOfReceiptFacilityId: string | null;
  portOfLoadingFacilityId: string | null;
  portOfDischargeFacilityId: string | null;
  placeOfDeliveryFacilityId: string | null;
  incoterm: string;
  shippingWindowStart: string | null;
  shippingWindowEnd: string | null;
  notes: string;
};

export type OrderBookableLinesResponse = {
  order: OrderBookableSummary | null;
  lines: OrderBookableLine[];
  errors: string[];
};

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [...ORDER_STATUSES];

export const ORDER_MANUAL_STATUS_OPTIONS: OrderStatus[] = [...MANUAL_ORDER_STATUSES];

export function isBookingDerivedOrderStatus(status: OrderStatus): boolean {
  return sharedIsBookingDerivedOrderStatus(status);
}

export const ORDER_TRANSPORT_MODES: OrderTransportMode[] = [...SHARED_ORDER_TRANSPORT_MODES];

export const INCOTERM_OPTIONS: Incoterm[] = ["", ...INCOTERMS_2020];

export const EMPTY_ORDER_LINE: OrderLineFormState = {
  lineKey: "",
  sku: "",
  description: "",
  quantity: "",
  uom: "",
  countryOfOrigin: "",
  totalGrossWeight: "",
  totalCbm: "",
};
