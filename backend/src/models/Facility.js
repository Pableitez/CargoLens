import mongoose from "mongoose";
import { FACILITY_TYPES } from "../../../shared/domain/tradeMasters.js";

const facilitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    facilityType: { type: String, enum: FACILITY_TYPES, default: "warehouse" },
    line1: { type: String, trim: true, default: "" },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    locationCode: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    /** unloc = auto from location catalog; manual = user-created */
    catalogSource: { type: String, enum: ["unloc", "manual"], default: "manual" },
  },
  { timestamps: true }
);

facilitySchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Facility = mongoose.models.Facility ?? mongoose.model("Facility", facilitySchema);
