import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { WorkspaceJob } from "../models/WorkspaceJob.js";
import { createImportJob } from "../services/jobs/workspaceJobProcessor.js";
import { serializeWorkspaceJob } from "../services/jobs/workspaceJobSerialize.js";
import { normalizeWorkspaceJobKind } from "../services/jobs/workspaceJobKinds.js";
import { devError } from "../utils/devLog.js";
import { isExcelFilename } from "../utils/spreadsheet.js";
import { dbUnavailable } from "./controllerHelpers.js";

export async function enqueueImportJob(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const kind = normalizeWorkspaceJobKind(req.body?.kind ?? req.query?.kind);
  if (!kind) {
    return res.status(400).json({ error: "INVALID_KIND", message: "Unknown import job kind." });
  }

  if (!req.file?.buffer?.length) {
    return res.status(400).json({ error: "INVALID_FILE", message: "Excel file is required." });
  }

  const fileName = req.file.originalname ?? "import.xlsx";
  if (!isExcelFilename(fileName)) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "Only Excel files (.xlsx or .xls) are supported.",
    });
  }

  try {
    const doc = await createImportJob({
      companyId: req.user.companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      kind,
      fileName,
      fileMime: req.file.mimetype ?? "",
      fileBuffer: req.file.buffer,
    });

    return res.status(202).json({ item: serializeWorkspaceJob(doc) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not queue import job." });
  }
}

export async function listWorkspaceJobs(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const companyId = req.user.companyId;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const status = String(req.query.status ?? "").trim();

  const filter = { companyId: new mongoose.Types.ObjectId(companyId) };
  if (status) {
    filter.status = status;
  }

  try {
    const rows = await WorkspaceJob.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ items: rows.map(serializeWorkspaceJob) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load jobs." });
  }
}

export async function getWorkspaceJob(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid job id." });
  }

  try {
    const row = await WorkspaceJob.findOne({
      _id: id,
      companyId: new mongoose.Types.ObjectId(req.user.companyId),
    }).lean();

    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Job not found." });
    }

    return res.json({ item: serializeWorkspaceJob(row) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load job." });
  }
}

export async function markWorkspaceJobsRead(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const companyId = new mongoose.Types.ObjectId(req.user.companyId);
  const now = new Date();
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => mongoose.isValidObjectId(id)) : [];

  try {
    const filter = { companyId, readAt: null, status: { $in: ["completed", "failed"] } };
    if (ids.length) filter._id = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };

    await WorkspaceJob.updateMany(filter, { $set: { readAt: now } });
    return res.json({ ok: true });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update jobs." });
  }
}
