import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { WorkspaceActivity } from "../models/WorkspaceActivity.js";
import { devError } from "../utils/devLog.js";

function dbUnavailable(res) {
  return res.status(503).json({
    error: "DB_UNAVAILABLE",
    message: "Database not configured or unreachable.",
  });
}

export async function listActivity(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const companyId = req.user.companyId;
  const limit = Math.min(Number(req.query.limit) || 80, 200);

  try {
    const rows = await WorkspaceActivity.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      items: rows.map((r) => ({
        id: r._id,
        action: r.action,
        summary: r.summary,
        meta: r.meta ?? {},
        actorEmail: r.actorEmail || null,
        createdAt: r.createdAt != null ? new Date(r.createdAt).toISOString() : null,
      })),
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load activity." });
  }
}
