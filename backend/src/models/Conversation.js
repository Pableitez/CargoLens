import mongoose from "mongoose";

const externalParticipantSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, trim: true, default: "" },
    addedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const conversationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    /** Client party — staff ↔ portal users of this contractual account. */
    contractualPartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["client_account"],
      default: "client_account",
    },
    subject: { type: String, trim: true, default: "" },
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessagePreview: { type: String, trim: true, default: "" },
    /** Invited externals (no app login yet) — for future email bridge. */
    externalParticipants: { type: [externalParticipantSchema], default: [] },
  },
  { timestamps: true }
);

conversationSchema.index({ companyId: 1, contractualPartyId: 1 }, { unique: true });

export const Conversation =
  mongoose.models.Conversation ?? mongoose.model("Conversation", conversationSchema);
