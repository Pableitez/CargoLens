import mongoose from "mongoose";
import { readExcelRows, isExcelFilename } from "../utils/spreadsheet.js";

export function dbUnavailable(res) {
  return res.status(503).json({
    error: "DB_UNAVAILABLE",
    message: "Database not configured or unreachable.",
  });
}

export function companyObjectId(companyId) {
  return new mongoose.Types.ObjectId(companyId);
}

export function readImportFile(req, res) {
  if (!req.file?.buffer) {
    res.status(400).json({ error: "INVALID_FILE", message: "Excel file is required." });
    return null;
  }
  if (!isExcelFilename(req.file.originalname ?? "")) {
    res.status(400).json({
      error: "INVALID_INPUT",
      message: "Only Excel files (.xlsx or .xls) are supported.",
    });
    return null;
  }
  try {
    return readExcelRows(req.file.buffer);
  } catch {
    res.status(400).json({ error: "INVALID_FILE", message: "Could not read Excel file." });
    return null;
  }
}
