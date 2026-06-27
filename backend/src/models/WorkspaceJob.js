import mongoose from "mongoose";
import { WORKSPACE_JOB_KINDS, WORKSPACE_JOB_STATUSES } from "../services/jobs/workspaceJobKinds.js";

const workspaceJobSchema = new mongoose.Schema(
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
    kind: { type: String, enum: WORKSPACE_JOB_KINDS, required: true, index: true },
    status: {
      type: String,
      enum: WORKSPACE_JOB_STATUSES,
      default: "pending",
      index: true,
    },
    fileName: { type: String, trim: true, default: "" },
    fileMime: { type: String, trim: true, default: "" },
    /** Excel buffer — cleared after processing to save space. */
    fileData: { type: Buffer, select: false },
    progressMessage: { type: String, trim: true, default: "" },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

workspaceJobSchema.index({ companyId: 1, createdAt: -1 });
workspaceJobSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export const WorkspaceJob =
  mongoose.models.WorkspaceJob ?? mongoose.model("WorkspaceJob", workspaceJobSchema);
