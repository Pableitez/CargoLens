import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
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
    title: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "open", "in_progress", "on_hold", "closed", "cancelled"],
      default: "draft",
      index: true,
    },
    tradeDirection: {
      type: String,
      enum: ["", "export", "import", "cross_trade"],
      default: "",
    },
    incoterm: { type: String, trim: true, default: "" },
    origin: { type: String, trim: true, default: "" },
    destination: { type: String, trim: true, default: "" },
    shipmentIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shipment" }],
      default: [],
    },
    openedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

caseSchema.index({ companyId: 1, reference: 1 }, { unique: true });

export const Case = mongoose.models.Case ?? mongoose.model("Case", caseSchema);
