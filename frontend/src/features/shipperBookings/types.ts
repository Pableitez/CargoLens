import {
  INCOTERMS_2020,
  ORDER_TRANSPORT_MODES as SHARED_ORDER_TRANSPORT_MODES,
} from "@shared/domain/orders.js";
import { SHIPPER_BOOKING_STATUSES } from "@shared/domain/shipperBookings.js";

export type ShipperBookingEventKind = "created" | "status_change" | "note" | "milestone" | "import";

export type ShipperBookingStatus = (typeof SHIPPER_BOOKING_STATUSES)[number];

export type ShipperBookingTransportMode = (typeof SHARED_ORDER_TRANSPORT_MODES)[number];

export type Incoterm = "" | (typeof INCOTERMS_2020)[number];

export type ShipperBookingLine = {
  lineKey: string;
  orderNumber: string;
  sku: string;
  externalBusinessId: string;
  bookedQuantity: number;
  quantityUnit: string;
  bookedPackages: number | null;
  packagesUnit: string;
  bookedVolume: number | null;
  bookedWeight: number | null;
  description: string;
  countryOfOrigin: string;
  commodityCode: string;
};

export type ShipperBooking = {
  id: string;
  bookingReference: string;
  customerReferenceNumber: string;
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
  cargoReadyDate: string | null;
  expectedReceiptDate: string | null;
  expectedDeliveryDate: string | null;
  transportMode: ShipperBookingTransportMode;
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  incoterm: string;
  incotermLocation: string;
  status: ShipperBookingStatus;
  lines: ShipperBookingLine[];
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

export type ShipperBookingEvent = {
  id: string;
  kind: ShipperBookingEventKind;
  message: string;
  actorEmail: string;
  visibleToClient: boolean;
  meta: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
};

export type ShipperBookingFormState = {
  bookingReference: string;
  customerReferenceNumber: string;
  customer: string;
  shipper: string;
  consignee: string;
  contractualPartyId: string;
  supplyChainId: string;
  operatingShipperPartyId: string;
  operatingConsigneePartyId: string;
  cargoReadyDate: string;
  expectedReceiptDate: string;
  expectedDeliveryDate: string;
  transportMode: ShipperBookingTransportMode;
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  placeOfReceiptFacilityId: string;
  portOfLoadingFacilityId: string;
  portOfDischargeFacilityId: string;
  placeOfDeliveryFacilityId: string;
  incoterm: string;
  incotermLocation: string;
  status: ShipperBookingStatus;
  remarks: string;
};

export type ShipperBookingLineFormState = {
  lineKey: string;
  orderNumber: string;
  sku: string;
  externalBusinessId: string;
  bookedQuantity: string;
  maxBookedQuantity: string;
  quantityUnit: string;
  bookedVolume: string;
  bookedWeight: string;
  description: string;
  countryOfOrigin: string;
};

export type ShipperBookingImportPreview = {
  ok: boolean;
  sheet: string;
  rowsTotal: number;
  valid: number;
  invalid: number;
  preview: {
    rowNumber: number;
    bookingReference: string;
    lineKey: string;
    errors: string[];
    valid: boolean;
  }[];
  errors: string[];
};

export type ShipperBookingImportResult = {
  ok: boolean;
  sheet: string;
  rowsTotal: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export const SHIPPER_BOOKING_STATUS_OPTIONS: ShipperBookingStatus[] = [...SHIPPER_BOOKING_STATUSES];

export const SHIPPER_BOOKING_TRANSPORT_MODES: ShipperBookingTransportMode[] = [
  ...SHARED_ORDER_TRANSPORT_MODES,
];

export const INCOTERM_OPTIONS: Incoterm[] = ["", ...INCOTERMS_2020];

export const EMPTY_SHIPPER_BOOKING_LINE: ShipperBookingLineFormState = {
  lineKey: "",
  orderNumber: "",
  sku: "",
  externalBusinessId: "",
  bookedQuantity: "",
  maxBookedQuantity: "",
  quantityUnit: "",
  bookedVolume: "",
  bookedWeight: "",
  description: "",
  countryOfOrigin: "",
};
