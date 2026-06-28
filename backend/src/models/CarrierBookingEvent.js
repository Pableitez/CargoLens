import mongoose from "mongoose";

const carrierBookingEventSchema = new mongoose.Schema(
  {
    carrierBookingRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarrierBookingRequest",
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
      enum: ["created", "status_change", "note", "submission", "provider_response"],
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
    visibleToClient: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

carrierBookingEventSchema.index({ carrierBookingRequestId: 1, occurredAt: -1 });

export const CarrierBookingEvent =
  mongoose.models.CarrierBookingEvent ?? mongoose.model("CarrierBookingEvent", carrierBookingEventSchema);
