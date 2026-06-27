import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderKind: {
      type: String,
      enum: ["staff", "client_portal", "external"],
      required: true,
    },
    senderDisplayName: { type: String, trim: true, default: "" },
    senderEmail: { type: String, trim: true, lowercase: true, default: "" },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.models.Message ?? mongoose.model("Message", messageSchema);
