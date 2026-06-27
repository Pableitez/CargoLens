import mongoose from "mongoose";

const orderEventSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
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

orderEventSchema.index({ orderId: 1, occurredAt: -1 });

export const OrderEvent = mongoose.models.OrderEvent ?? mongoose.model("OrderEvent", orderEventSchema);
