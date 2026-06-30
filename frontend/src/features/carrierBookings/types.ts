import {
  CARRIER_BOOKING_ENVIRONMENTS,
  CARRIER_BOOKING_PROVIDERS,
  CARRIER_BOOKING_STATUSES,
  CARRIER_FREIGHT_PAYMENT_TERMS,
  CARRIER_SCAC_CODES,
  CARRIER_SERVICE_TYPES,
  CONTAINER_EQUIPMENT_TYPES,
} from "@shared/domain/carrierBookings.js";
import { INCOTERMS_2020 } from "@shared/domain/orders.js";
import type { ShipperBooking, ShipperBookingLine } from "../shipperBookings/types";

export type CarrierBookingStatus = (typeof CARRIER_BOOKING_STATUSES)[number];

export type CarrierBookingProvider = (typeof CARRIER_BOOKING_PROVIDERS)[number];

export type CarrierBookingEnvironment = (typeof CARRIER_BOOKING_ENVIRONMENTS)[number];

export type CarrierFreightPaymentTerm = (typeof CARRIER_FREIGHT_PAYMENT_TERMS)[number];

export type CarrierServiceType = (typeof CARRIER_SERVICE_TYPES)[number];

export type CarrierBookingEventKind =
  | "created"
  | "status_change"
  | "note"
  | "submission"
  | "provider_response"
  | "sb_linked"
  | "sb_unlinked";

export type CarrierBookingEquipment = {
  quantity: number;
  equipmentType: string;
  weightKg: number | null;
  volumeCbm: number | null;
  shipperOwned: boolean;
};

export type CarrierBookingCargoLine = ShipperBookingLine & {
  sourceShipperBookingReference: string;
};

export type CarrierBookingRoutingLegMode = "road" | "ocean" | "rail" | "transshipment";

export type CarrierBookingRoutingLeg = {
  sequence: number;
  transportMode: CarrierBookingRoutingLegMode;
  originCode: string;
  destinationCode: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  vesselName?: string;
  voyageNumber?: string;
  etd?: string | null;
  eta?: string | null;
};

export type CarrierBookingRequest = {
  id: string;
  requestReference: string;
  shipperBookingIds: string[];
  shipperBookingId: string | null;
  shipperBookingReferences: string[];
  shipperBookingReference: string;
  provider: CarrierBookingProvider;
  environment: CarrierBookingEnvironment;
  carrierScac: string;
  carrierName: string;
  serviceType: CarrierServiceType;
  freightPaymentTerms: CarrierFreightPaymentTerm;
  contractNumber: string;
  status: CarrierBookingStatus;
  idempotencyKey: string;
  externalReference: string;
  externalStatus: string;
  inttraTransactionId: string;
  bookingParty: string;
  customer: string;
  shipper: string;
  consignee: string;
  notifyParty: string;
  clientId: string | null;
  supplyChainId: string | null;
  operatingShipperPartyId: string | null;
  operatingConsigneePartyId: string | null;
  placeOfReceiptFacilityId: string | null;
  portOfLoadingFacilityId: string | null;
  portOfDischargeFacilityId: string | null;
  placeOfDeliveryFacilityId: string | null;
  customerReferenceNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfReceipt: string;
  placeOfDelivery: string;
  routingLegs: CarrierBookingRoutingLeg[];
  cargoReadyDate: string | null;
  expectedReceiptDate: string | null;
  expectedDeliveryDate: string | null;
  requestedDepartureDate: string | null;
  incoterm: string;
  incotermLocation: string;
  cargoDescription: string;
  totalGrossWeightKg: number | null;
  totalVolumeCbm: number | null;
  totalPackages: number | null;
  dangerousGoods: boolean;
  cargoLines: CarrierBookingCargoLine[];
  equipment: CarrierBookingEquipment[];
  specialInstructions: string;
  payloadSnapshot: Record<string, unknown> | null;
  lastResponse: Record<string, unknown> | null;
  lastResponseSource: "" | "mock" | "inttra";
  submittedAt: string | null;
  acknowledgedAt: string | null;
  confirmedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

export type CarrierBookingEvent = {
  id: string;
  kind: CarrierBookingEventKind;
  message: string;
  actorEmail: string;
  visibleToClient: boolean;
  meta: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
};

export type CarrierBookingFormState = {
  requestReference: string;
  shipperBookingIds: string[];
  carrierScac: string;
  environment: CarrierBookingEnvironment;
  provider: CarrierBookingProvider;
  serviceType: CarrierServiceType;
  freightPaymentTerms: CarrierFreightPaymentTerm;
  contractNumber: string;
  bookingParty: string;
  customer: string;
  shipper: string;
  consignee: string;
  notifyParty: string;
  contractualPartyId: string;
  supplyChainId: string;
  operatingShipperPartyId: string;
  operatingConsigneePartyId: string;
  placeOfReceiptFacilityId: string;
  portOfLoadingFacilityId: string;
  portOfDischargeFacilityId: string;
  placeOfDeliveryFacilityId: string;
  customerReferenceNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfReceipt: string;
  placeOfDelivery: string;
  routingLegs: CarrierBookingRoutingLeg[];
  cargoReadyDate: string;
  expectedReceiptDate: string;
  expectedDeliveryDate: string;
  requestedDepartureDate: string;
  incoterm: string;
  incotermLocation: string;
  cargoDescription: string;
  totalGrossWeightKg: string;
  totalVolumeCbm: string;
  totalPackages: string;
  dangerousGoods: boolean;
  cargoLines: CarrierBookingCargoLine[];
  specialInstructions: string;
  remarks: string;
  equipment: CarrierBookingEquipment[];
};

export {
  CARRIER_SCAC_CODES,
  CARRIER_SERVICE_TYPES,
  CARRIER_FREIGHT_PAYMENT_TERMS,
  CONTAINER_EQUIPMENT_TYPES,
  INCOTERMS_2020,
};

export function emptyCarrierBookingForm(): CarrierBookingFormState {
  return {
    requestReference: "",
    shipperBookingIds: [],
    carrierScac: "CMDU",
    environment: "mock",
    provider: "inttra",
    serviceType: "FCL",
    freightPaymentTerms: "",
    contractNumber: "",
    bookingParty: "",
    customer: "",
    shipper: "",
    consignee: "",
    notifyParty: "",
    contractualPartyId: "",
    supplyChainId: "",
    operatingShipperPartyId: "",
    operatingConsigneePartyId: "",
    placeOfReceiptFacilityId: "",
    portOfLoadingFacilityId: "",
    portOfDischargeFacilityId: "",
    placeOfDeliveryFacilityId: "",
    customerReferenceNumber: "",
    portOfLoading: "",
    portOfDischarge: "",
    placeOfReceipt: "",
    placeOfDelivery: "",
    routingLegs: [],
    cargoReadyDate: "",
    expectedReceiptDate: "",
    expectedDeliveryDate: "",
    requestedDepartureDate: "",
    incoterm: "",
    incotermLocation: "",
    cargoDescription: "",
    totalGrossWeightKg: "",
    totalVolumeCbm: "",
    totalPackages: "",
    dangerousGoods: false,
    cargoLines: [],
    specialInstructions: "",
    remarks: "",
    equipment: [{ quantity: 1, equipmentType: "40HC", weightKg: null, volumeCbm: null, shipperOwned: false }],
  };
}

export type { ShipperBooking };
