import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true, uppercase: true, index: true },
  },
  { timestamps: true }
);

export const Company = mongoose.models.Company ?? mongoose.model("Company", companySchema);
