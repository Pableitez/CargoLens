import mongoose from "mongoose";

const orderLineSchema = new mongoose.Schema(
  {
    lineKey: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    countryOfOrigin: { type: String, trim: true, default: "" },
    totalGrossWeight: { type: Number, default: null },
    totalCbm: { type: Number, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, trim: true },
    externalBusinessId: { type: String, trim: true, default: "" },
    customer: { type: String, required: true, trim: true },
    shipper: { type: String, required: true, trim: true },
    consignee: { type: String, required: true, trim: true },
    shippingWindowStart: { type: Date, default: null },
    shippingWindowEnd: { type: Date, default: null },
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
    status: {
      type: String,
      enum: ["draft", "new", "partially_booked", "booked", "cancelled"],
      default: "draft",
      index: true,
    },
    lines: { type: [orderLineSchema], default: [] },
    notes: { type: String, trim: true, default: "" },
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

orderSchema.index({ companyId: 1, orderNumber: 1 }, { unique: true });

export const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
