import mongoose from "mongoose";

const shipperBookingEventSchema = new mongoose.Schema(
  {
    shipperBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShipperBooking",
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
      enum: ["created", "status_change", "note", "milestone", "import"],
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

shipperBookingEventSchema.index({ shipperBookingId: 1, occurredAt: -1 });

export const ShipperBookingEvent =
  mongoose.models.ShipperBookingEvent ?? mongoose.model("ShipperBookingEvent", shipperBookingEventSchema);
