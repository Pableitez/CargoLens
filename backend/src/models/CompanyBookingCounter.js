import mongoose from "mongoose";

const companyBookingCounterSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    year: { type: Number, required: true },
    kind: {
      type: String,
      enum: ["shipper", "carrier"],
      default: "shipper",
      required: true,
    },
    seq: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

companyBookingCounterSchema.index({ companyId: 1, year: 1, kind: 1 }, { unique: true });

export const CompanyBookingCounter =
  mongoose.models.CompanyBookingCounter ??
  mongoose.model("CompanyBookingCounter", companyBookingCounterSchema);
