import mongoose from "mongoose";
import { WorkspaceJob } from "../../models/WorkspaceJob.js";
import { importOrderRows } from "../orders/orderImport.js";
import { importShipperBookingRows } from "../shipperBookings/shipperBookingImport.js";
import { importTradeMastersWorkbookByKind } from "../tradeMasters/tradeMastersImport.js";
import { logWorkspaceActivity } from "../workspaceActivityLog.js";
import { devError } from "../../utils/devLog.js";
import { readExcelRows, readExcelWorkbook } from "../../utils/spreadsheet.js";

const runningJobIds = new Set();

function actorFromJob(job) {
  return {
    userId: job.userId ? String(job.userId) : null,
    companyId: String(job.companyId),
    email: job.actorEmail ?? "",
  };
}

async function updateJobProgress(jobId, patch) {
  await WorkspaceJob.updateOne({ _id: jobId }, { $set: patch });
}

function buildImportSummary(kind, result) {
  if (!result || result.ok === false) return "Import failed";
  const parts = [];
  if (result.created) parts.push(`${result.created} created`);
  if (result.updated) parts.push(`${result.updated} updated`);
  if (result.linked) parts.push(`${result.linked} linked`);
  if (result.skipped) parts.push(`${result.skipped} skipped`);
  const detail = parts.length ? parts.join(", ") : "Done";
  const label = kind.replace(/^import\./, "").replace(/\./g, " · ");
  return `${label} · ${detail}`;
}

function activityActionForKind(kind) {
  if (kind.startsWith("import.trade_masters.")) return "trade_masters.import";
  if (kind === "import.orders") return "order.import";
  if (kind === "import.shipper_bookings") return "shipper_booking.import";
  return "import.job";
}

async function runTradeMastersImport(job, tradeKind) {
  const workbook = readExcelWorkbook(job.fileData);
  await updateJobProgress(job._id, {
    progressMessage: "Processing spreadsheet…",
    progressPercent: 25,
  });
  const result = await importTradeMastersWorkbookByKind(workbook, String(job.companyId), tradeKind);
  return result;
}

async function runOrdersImport(job) {
  const { sheetName, rows } = readExcelRows(job.fileData);
  if (!rows.length) {
    return { ok: false, error: "The sheet has no data rows." };
  }
  await updateJobProgress(job._id, {
    progressMessage: `Importing ${rows.length} rows…`,
    progressPercent: 30,
    meta: { sheet: sheetName, rowsTotal: rows.length },
  });
  const { created, updated, skipped, errors } = await importOrderRows(
    rows,
    String(job.companyId),
    actorFromJob(job)
  );
  return {
    ok: true,
    sheet: sheetName,
    rowsTotal: rows.length,
    created,
    updated,
    skipped,
    errors,
  };
}

async function runShipperBookingsImport(job) {
  const { sheetName, rows } = readExcelRows(job.fileData);
  if (!rows.length) {
    return { ok: false, error: "The sheet has no data rows." };
  }
  await updateJobProgress(job._id, {
    progressMessage: `Importing ${rows.length} rows…`,
    progressPercent: 30,
    meta: { sheet: sheetName, rowsTotal: rows.length },
  });
  const { created, updated, skipped, errors } = await importShipperBookingRows(
    rows,
    String(job.companyId),
    actorFromJob(job)
  );
  return {
    ok: true,
    sheet: sheetName,
    rowsTotal: rows.length,
    created,
    updated,
    skipped,
    errors,
  };
}

async function executeJob(job) {
  const tradeKind = job.kind.replace("import.trade_masters.", "");
  if (job.kind.startsWith("import.trade_masters.")) {
    return runTradeMastersImport(job, tradeKind);
  }
  if (job.kind === "import.orders") return runOrdersImport(job);
  if (job.kind === "import.shipper_bookings") return runShipperBookingsImport(job);
  return { ok: false, error: "Unsupported job kind." };
}

export async function processWorkspaceJob(jobId) {
  const id = String(jobId);
  if (runningJobIds.has(id)) return;
  runningJobIds.add(id);

  try {
    const job = await WorkspaceJob.findById(jobId).select("+fileData");
    if (!job || job.status === "completed" || job.status === "failed") return;

    if (job.status === "pending") {
      job.status = "running";
      job.startedAt = new Date();
      job.progressMessage = "Starting…";
      job.progressPercent = 5;
      await job.save();
    }

    if (!job.fileData?.length) {
      job.status = "failed";
      job.errorMessage = "Import file data is missing.";
      job.completedAt = new Date();
      job.fileData = undefined;
      await job.save();
      return;
    }

    const result = await executeJob(job);

    if (!result.ok) {
      job.status = "failed";
      job.errorMessage = String(result.error ?? "Import failed.").slice(0, 500);
      job.progressPercent = 100;
      job.completedAt = new Date();
      job.fileData = undefined;
      await job.save();
      return;
    }

    const summary = buildImportSummary(job.kind, result);
    job.status = "completed";
    job.result = result;
    job.summary = summary.slice(0, 500);
    job.progressMessage = "Completed";
    job.progressPercent = 100;
    job.completedAt = new Date();
    job.fileData = undefined;
    await job.save();

    void logWorkspaceActivity({
      companyId: job.companyId,
      userId: job.userId,
      actorEmail: job.actorEmail,
      action: activityActionForKind(job.kind),
      summary,
      meta: {
        jobId: String(job._id),
        kind: job.kind,
        fileName: job.fileName,
        ...(result.created !== undefined ? { created: result.created } : {}),
        ...(result.updated !== undefined ? { updated: result.updated } : {}),
        ...(result.linked !== undefined ? { linked: result.linked } : {}),
        ...(result.skipped !== undefined ? { skipped: result.skipped } : {}),
      },
    });
  } catch (err) {
    devError("[workspace job]", err);
    try {
      await WorkspaceJob.updateOne(
        { _id: jobId },
        {
          $set: {
            status: "failed",
            errorMessage: String(err.message ?? err).slice(0, 500),
            progressPercent: 100,
            completedAt: new Date(),
          },
          $unset: { fileData: "" },
        }
      );
    } catch (updateErr) {
      devError("[workspace job] failed to mark job failed", updateErr);
    }
  } finally {
    runningJobIds.delete(id);
  }
}

export function scheduleWorkspaceJob(jobId) {
  setImmediate(() => {
    void processWorkspaceJob(jobId);
  });
}

/** Re-queue jobs left running after a process restart. */
export async function recoverInterruptedWorkspaceJobs() {
  try {
    const stale = await WorkspaceJob.find({ status: "running" }).select("_id").lean();
    if (!stale.length) return;
    await WorkspaceJob.updateMany(
      { status: "running" },
      {
        $set: {
          status: "pending",
          progressMessage: "Resuming after restart…",
          progressPercent: 0,
        },
      }
    );
    for (const row of stale) {
      scheduleWorkspaceJob(row._id);
    }
  } catch (err) {
    devError("[workspace job] recovery failed", err);
  }
}

export async function createImportJob({
  companyId,
  userId,
  actorEmail,
  kind,
  fileName,
  fileMime,
  fileBuffer,
}) {
  const doc = await WorkspaceJob.create({
    companyId: new mongoose.Types.ObjectId(companyId),
    userId: userId ? new mongoose.Types.ObjectId(userId) : null,
    actorEmail: String(actorEmail ?? "")
      .toLowerCase()
      .trim(),
    kind,
    status: "pending",
    fileName: String(fileName ?? "import.xlsx").slice(0, 200),
    fileMime: String(fileMime ?? "").slice(0, 120),
    fileData: fileBuffer,
    progressMessage: "Queued…",
    progressPercent: 0,
  });
  scheduleWorkspaceJob(doc._id);
  return doc;
}
