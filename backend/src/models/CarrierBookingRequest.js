import mongoose from "mongoose";

const carrierBookingEquipmentSchema = new mongoose.Schema(
  {
    quantity: { type: Number, required: true, min: 1, default: 1 },
    equipmentType: { type: String, required: true, trim: true },
    weightKg: { type: Number, default: null },
    volumeCbm: { type: Number, default: null },
    shipperOwned: { type: Boolean, default: false },
  },
  { _id: false }
);

const carrierBookingCargoLineSchema = new mongoose.Schema(
  {
    sourceShipperBookingReference: { type: String, trim: true, default: "" },
    lineKey: { type: String, required: true, trim: true },
    orderNumber: { type: String, trim: true, default: "" },
    sku: { type: String, required: true, trim: true },
    externalBusinessId: { type: String, trim: true, default: "" },
    bookedQuantity: { type: Number, required: true, min: 0 },
    quantityUnit: { type: String, required: true, trim: true },
    bookedPackages: { type: Number, default: null },
    packagesUnit: { type: String, trim: true, default: "" },
    bookedVolume: { type: Number, default: null },
    bookedWeight: { type: Number, default: null },
    description: { type: String, trim: true, default: "" },
    countryOfOrigin: { type: String, trim: true, default: "" },
    commodityCode: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const carrierBookingRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    requestReference: { type: String, required: true, trim: true },
    shipperBookingIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "ShipperBooking" }],
      default: [],
      index: true,
    },
    /** Primary SB (first selected) — null for manual CB created without SB. */
    shipperBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShipperBooking",
      default: null,
      index: true,
    },
    shipperBookingReferences: { type: [String], default: [] },
    shipperBookingReference: { type: String, trim: true, default: "" },
    provider: {
      type: String,
      enum: ["mock", "inttra"],
      default: "inttra",
      index: true,
    },
    environment: {
      type: String,
      enum: ["mock", "sandbox", "production"],
      default: "mock",
    },
    carrierScac: { type: String, required: true, trim: true, uppercase: true },
    carrierName: { type: String, trim: true, default: "" },
    serviceType: { type: String, enum: ["FCL", "LCL"], default: "FCL" },
    freightPaymentTerms: {
      type: String,
      enum: ["", "prepaid", "collect"],
      default: "",
    },
    contractNumber: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "submitted", "acknowledged", "confirmed", "rejected", "cancelled", "failed"],
      default: "draft",
      index: true,
    },
    idempotencyKey: { type: String, trim: true, default: "" },
    externalReference: { type: String, trim: true, default: "" },
    externalStatus: { type: String, trim: true, default: "" },
    inttraTransactionId: { type: String, trim: true, default: "" },
    bookingParty: { type: String, trim: true, default: "" },
    customer: { type: String, trim: true, default: "" },
    shipper: { type: String, trim: true, default: "" },
    consignee: { type: String, trim: true, default: "" },
    notifyParty: { type: String, trim: true, default: "" },
    contractualPartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      default: null,
      index: true,
    },
    supplyChainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplyChain",
      default: null,
    },
    operatingShipperPartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      default: null,
    },
    operatingConsigneePartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      default: null,
    },
    placeOfReceiptFacilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
    },
    portOfLoadingFacilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
    },
    portOfDischargeFacilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
    },
    placeOfDeliveryFacilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
    },
    customerReferenceNumber: { type: String, trim: true, default: "" },
    placeOfReceipt: { type: String, trim: true, default: "" },
    portOfLoading: { type: String, trim: true, default: "" },
    portOfDischarge: { type: String, trim: true, default: "" },
    placeOfDelivery: { type: String, trim: true, default: "" },
    cargoReadyDate: { type: Date, default: null },
    expectedReceiptDate: { type: Date, default: null },
    expectedDeliveryDate: { type: Date, default: null },
    requestedDepartureDate: { type: Date, default: null },
    incoterm: { type: String, trim: true, default: "" },
    incotermLocation: { type: String, trim: true, default: "" },
    cargoDescription: { type: String, trim: true, default: "" },
    totalGrossWeightKg: { type: Number, default: null },
    totalVolumeCbm: { type: Number, default: null },
    totalPackages: { type: Number, default: null },
    dangerousGoods: { type: Boolean, default: false },
    cargoLines: { type: [carrierBookingCargoLineSchema], default: [] },
    equipment: { type: [carrierBookingEquipmentSchema], default: [] },
    specialInstructions: { type: String, trim: true, default: "" },
    payloadSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    lastResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    lastResponseSource: { type: String, enum: ["mock", "inttra", ""], default: "" },
    submittedAt: { type: Date, default: null },
    acknowledgedAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

carrierBookingRequestSchema.index({ companyId: 1, requestReference: 1 }, { unique: true });
carrierBookingRequestSchema.index({ companyId: 1, status: 1, updatedAt: -1 });

export const CarrierBookingRequest =
  mongoose.models.CarrierBookingRequest ??
  mongoose.model("CarrierBookingRequest", carrierBookingRequestSchema);
