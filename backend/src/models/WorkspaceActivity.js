import mongoose from "mongoose";

const workspaceActivitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorEmail: { type: String, trim: true, default: "" },
    action: {
      type: String,
      required: true,
      index: true,
    },
    summary: { type: String, required: true, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

workspaceActivitySchema.index({ companyId: 1, createdAt: -1 });

export const WorkspaceActivity =
  mongoose.models.WorkspaceActivity ?? mongoose.model("WorkspaceActivity", workspaceActivitySchema);
