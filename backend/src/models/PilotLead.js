import mongoose from "mongoose";

const pilotLeadSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true, default: "" },
    locale: { type: String, trim: true, default: "en" },
    source: { type: String, trim: true, default: "landing" },
  },
  { timestamps: true }
);

export const PilotLead = mongoose.models.PilotLead ?? mongoose.model("PilotLead", pilotLeadSchema);
