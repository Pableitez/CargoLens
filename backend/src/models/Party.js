import mongoose from "mongoose";
import {
  PARTY_ADDRESS_LABELS,
  PARTY_FACILITY_PURPOSES,
  PARTY_RELATED_LINK_TYPES,
  PARTY_RELATIONSHIP_TYPES,
  PARTY_ROLES,
} from "../../../shared/domain/tradeMasters.js";

const partyAddressSchema = new mongoose.Schema(
  {
    label: { type: String, enum: PARTY_ADDRESS_LABELS, default: "registered", trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const partyContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    jobTitle: { type: String, trim: true, default: "" },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const partyAliasSchema = new mongoose.Schema(
  {
    role: { type: String, enum: PARTY_ROLES, required: true },
    aliasCode: { type: String, required: true, trim: true },
    source: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const partyRelationSchema = new mongoose.Schema(
  {
    relatedPartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
    },
    relationshipType: {
      type: String,
      enum: PARTY_RELATED_LINK_TYPES,
      default: "other",
    },
    primaryRole: { type: String, enum: PARTY_ROLES, default: "shipper" },
    /** How the contractual client refers to the related party in this link (Excel operating_*_code). */
    clientAlias: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const partyFacilitySchema = new mongoose.Schema(
  {
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    purpose: {
      type: String,
      enum: PARTY_FACILITY_PURPOSES,
      default: "operates",
    },
    primaryRole: { type: String, enum: PARTY_ROLES, default: "shipper" },
    isPrimary: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const partySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true, uppercase: true },
    legalName: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    vat: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    addressBook: { type: [partyAddressSchema], default: [] },
    contacts: { type: [partyContactSchema], default: [] },
    aliases: { type: [partyAliasSchema], default: [] },
    relatedParties: { type: [partyRelationSchema], default: [] },
    relatedFacilities: { type: [partyFacilitySchema], default: [] },
    /** operational = actor in network; contractual = client account (portal, orders, containers). */
    accountTier: {
      type: String,
      enum: ["operational", "contractual"],
      default: "operational",
      index: true,
    },
    /** primary | subsidiary — only for accountTier contractual. */
    contractualTier: {
      type: String,
      enum: ["primary", "subsidiary"],
      default: "primary",
    },
    parentPartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      default: null,
      index: true,
    },
    /** Portal invite — unique when set (contractual accounts). */
    inviteCode: { type: String, trim: true, uppercase: true, default: "" },
  },
  { timestamps: true }
);

partySchema.index({ companyId: 1, code: 1 }, { unique: true });
partySchema.index(
  { inviteCode: 1 },
  {
    unique: true,
    partialFilterExpression: { inviteCode: { $type: "string", $ne: "" } },
  }
);

export const Party = mongoose.models.Party ?? mongoose.model("Party", partySchema);
