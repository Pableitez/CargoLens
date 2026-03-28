import mongoose from "mongoose";
import { WorkspaceActivity } from "../models/WorkspaceActivity.js";
import { devError } from "../utils/devLog.js";

// Registro de actividad best-effort; fallos solo en consola, sin propagar.
export async function logWorkspaceActivity({
  companyId,
  userId,
  actorEmail,
  action,
  summary,
  meta = {},
}) {
  try {
    await WorkspaceActivity.create({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: userId ? new mongoose.Types.ObjectId(userId) : null,
      actorEmail: String(actorEmail ?? "").toLowerCase().trim(),
      action,
      summary: String(summary).slice(0, 500),
      meta,
    });
  } catch (err) {
    devError("[workspace activity]", err.message);
  }
}
