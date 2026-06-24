import mongoose from "mongoose";

const shipmentEventSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["created", "status_change", "eta_change", "note", "milestone", "import"],
      required: true,
      index: true,
    },
    message: { type: String, required: true, trim: true },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorEmail: { type: String, trim: true, default: "" },
    visibleToClient: { type: Boolean, default: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

shipmentEventSchema.index({ shipmentId: 1, occurredAt: -1 });

export const ShipmentEvent =
  mongoose.models.ShipmentEvent ?? mongoose.model("ShipmentEvent", shipmentEventSchema);
