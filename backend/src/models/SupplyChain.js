import mongoose from "mongoose";
import {
  PARTY_ROLES,
  SUPPLY_CHAIN_DIRECTIONS,
  SUPPLY_CHAIN_PRIMARY_ROLES,
} from "../../../shared/domain/tradeMasters.js";

const chainNodeSchema = new mongoose.Schema(
  {
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
    },
    role: {
      type: String,
      enum: PARTY_ROLES,
      required: true,
    },
  },
  { _id: false }
);

const supplyChainSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    /** Client party (contractual primary) that owns this supply chain. */
    contractualPartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
      index: true,
    },
    /** Hub party — supply chain = this party + its related parties. */
    primaryPartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      default: null,
      index: true,
    },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    direction: {
      type: String,
      enum: SUPPLY_CHAIN_DIRECTIONS,
      default: "export",
    },
    primaryRole: {
      type: String,
      enum: SUPPLY_CHAIN_PRIMARY_ROLES,
      default: "shipper",
    },
    defaultIncoterm: { type: String, trim: true, default: "" },
    defaultTransportMode: { type: String, trim: true, default: "" },
    defaultPortOfLoading: { type: String, trim: true, default: "" },
    defaultPortOfDischarge: { type: String, trim: true, default: "" },
    nodes: { type: [chainNodeSchema], default: [] },
  },
  { timestamps: true }
);

supplyChainSchema.index({ companyId: 1, contractualPartyId: 1, code: 1 }, { unique: true });

export const SupplyChain = mongoose.models.SupplyChain ?? mongoose.model("SupplyChain", supplyChainSchema);
