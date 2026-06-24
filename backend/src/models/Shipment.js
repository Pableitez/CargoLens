import mongoose from "mongoose";

const containerItemSchema = new mongoose.Schema(
  {
    containerNumber: { type: String, required: true, trim: true, uppercase: true },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    reference: { type: String, required: true, trim: true },
    origin: { type: String, trim: true, default: "" },
    destination: { type: String, trim: true, default: "" },
    etd: { type: Date, default: null },
    eta: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "booked", "in_transit", "at_port", "delivered", "cancelled"],
      default: "draft",
      index: true,
    },
    notes: { type: String, trim: true, default: "" },
    containers: { type: [containerItemSchema], default: [] },
  },
  { timestamps: true }
);

shipmentSchema.index({ companyId: 1, reference: 1 }, { unique: true });

export const Shipment = mongoose.models.Shipment ?? mongoose.model("Shipment", shipmentSchema);
