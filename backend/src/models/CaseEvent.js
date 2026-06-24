import mongoose from "mongoose";

const caseEventSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
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
      enum: ["created", "status_change", "note", "milestone", "shipment_linked", "shipment_unlinked"],
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

caseEventSchema.index({ caseId: 1, occurredAt: -1 });

export const CaseEvent = mongoose.models.CaseEvent ?? mongoose.model("CaseEvent", caseEventSchema);
