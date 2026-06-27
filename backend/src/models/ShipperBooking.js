import mongoose from "mongoose";

const shipperBookingLineSchema = new mongoose.Schema(
  {
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

const shipperBookingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    bookingReference: { type: String, required: true, trim: true },
    customerReferenceNumber: { type: String, trim: true, default: "" },
    customer: { type: String, required: true, trim: true },
    shipper: { type: String, required: true, trim: true },
    consignee: { type: String, required: true, trim: true },
    cargoReadyDate: { type: Date, default: null },
    expectedReceiptDate: { type: Date, default: null },
    expectedDeliveryDate: { type: Date, default: null },
    transportMode: {
      type: String,
      enum: ["", "ocean", "rail", "truck", "air"],
      default: "",
    },
    placeOfReceipt: { type: String, trim: true, default: "" },
    portOfLoading: { type: String, trim: true, default: "" },
    portOfDischarge: { type: String, trim: true, default: "" },
    placeOfDelivery: { type: String, trim: true, default: "" },
    incoterm: { type: String, trim: true, default: "" },
    incotermLocation: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "new", "confirmed", "cancelled"],
      default: "draft",
      index: true,
    },
    lines: { type: [shipperBookingLineSchema], default: [] },
    remarks: { type: String, trim: true, default: "" },
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
      index: true,
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
  },
  { timestamps: true }
);

shipperBookingSchema.index({ companyId: 1, bookingReference: 1 }, { unique: true });

export const ShipperBooking =
  mongoose.models.ShipperBooking ?? mongoose.model("ShipperBooking", shipperBookingSchema);
