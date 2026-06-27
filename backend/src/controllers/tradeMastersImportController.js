import { isDbConnected } from "../db.js";
import {
  buildKindExportBuffer,
  buildKindImportTemplateBuffer,
  buildTradeMastersExportBuffer,
  buildTradeMastersImportTemplateBuffer,
  kindExportFilename,
  kindTemplateFilename,
  TRADE_MASTERS_EXPORT_FILENAME,
  TRADE_MASTERS_IMPORT_TEMPLATE_FILENAME,
} from "../services/tradeMasters/tradeMastersImportTemplate.js";
import {
  importTradeMastersWorkbook,
  importTradeMastersWorkbookByKind,
  previewTradeMastersImport,
  previewTradeMastersImportByKind,
} from "../services/tradeMasters/tradeMastersImport.js";
import { normalizeImportKind } from "../services/tradeMasters/tradeMastersImportKinds.js";
import { readExcelWorkbook } from "../utils/spreadsheet.js";
import { devError } from "../utils/devLog.js";
import { dbUnavailable, readImportFile } from "./controllerHelpers.js";

function invalidKind(res) {
  return res.status(400).json({ error: "INVALID_KIND", message: "Unknown import type." });
}

export function downloadTradeMastersImportTemplate(_req, res) {
  try {
    const buffer = buildTradeMastersImportTemplateBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${TRADE_MASTERS_IMPORT_TEMPLATE_FILENAME}"`);
    return res.send(buffer);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not build import template." });
  }
}

export function downloadKindImportTemplate(req, res) {
  const kind = normalizeImportKind(req.params.kind);
  if (!kind) return invalidKind(res);

  try {
    const buffer = buildKindImportTemplateBuffer(kind);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${kindTemplateFilename(kind)}"`);
    return res.send(buffer);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not build import template." });
  }
}

export async function downloadTradeMastersExport(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  try {
    const buffer = await buildTradeMastersExportBuffer(req.user.companyId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${TRADE_MASTERS_EXPORT_FILENAME}"`);
    return res.send(buffer);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not export trade masters." });
  }
}

export async function downloadKindExport(req, res) {
  const kind = normalizeImportKind(req.params.kind);
  if (!kind) return invalidKind(res);
  if (!isDbConnected()) return dbUnavailable(res);

  try {
    const buffer = await buildKindExportBuffer(kind, req.user.companyId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${kindExportFilename(kind)}"`);
    return res.send(buffer);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not export data." });
  }
}

export async function previewImportTradeMasters(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;

  try {
    const workbook = readExcelWorkbook(req.file.buffer);
    const result = await previewTradeMastersImport(workbook, req.user.companyId);
    if (!result.ok) {
      return res.status(400).json({ error: "INVALID_FILE", message: result.error });
    }
    return res.json(result);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not preview import." });
  }
}

export async function previewKindImport(req, res) {
  const kind = normalizeImportKind(req.params.kind);
  if (!kind) return invalidKind(res);
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;

  try {
    const workbook = readExcelWorkbook(req.file.buffer);
    const result = await previewTradeMastersImportByKind(workbook, req.user.companyId, kind);
    if (!result.ok) {
      return res.status(400).json({ error: "INVALID_FILE", message: result.error });
    }
    return res.json(result);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not preview import." });
  }
}

export async function importTradeMasters(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;

  try {
    const workbook = readExcelWorkbook(req.file.buffer);
    const result = await importTradeMastersWorkbook(workbook, req.user.companyId);
    if (!result.ok) {
      return res.status(400).json({ error: "INVALID_FILE", message: result.error });
    }
    return res.json(result);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not import trade masters." });
  }
}

export async function importKindTradeMasters(req, res) {
  const kind = normalizeImportKind(req.params.kind);
  if (!kind) return invalidKind(res);
  if (!isDbConnected()) return dbUnavailable(res);

  const parsed = readImportFile(req, res);
  if (!parsed) return;

  try {
    const workbook = readExcelWorkbook(req.file.buffer);
    const result = await importTradeMastersWorkbookByKind(workbook, req.user.companyId, kind);
    if (!result.ok) {
      return res.status(400).json({ error: "INVALID_FILE", message: result.error });
    }
    return res.json(result);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not import file." });
  }
}
