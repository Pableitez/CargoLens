import { Router } from "express";
import { spreadsheetUpload } from "../config/upload.js";
import {
  downloadKindExport,
  downloadKindImportTemplate,
  downloadTradeMastersExport,
  downloadTradeMastersImportTemplate,
  importKindTradeMasters,
  importTradeMasters,
  previewImportTradeMasters,
  previewKindImport,
} from "../controllers/tradeMastersImportController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const tradeMastersRouter = Router();

tradeMastersRouter.use(requireAuth);

tradeMastersRouter.get("/import/:kind/template", requireStaff, downloadKindImportTemplate);
tradeMastersRouter.get("/import/:kind/export", requireStaff, downloadKindExport);
tradeMastersRouter.post(
  "/import/:kind/preview",
  requireStaff,
  spreadsheetUpload.single("file"),
  previewKindImport
);
tradeMastersRouter.post(
  "/import/:kind",
  requireStaff,
  spreadsheetUpload.single("file"),
  importKindTradeMasters
);

tradeMastersRouter.get("/import/template", requireStaff, downloadTradeMastersImportTemplate);
tradeMastersRouter.get("/import/export", requireStaff, downloadTradeMastersExport);
tradeMastersRouter.post(
  "/import/preview",
  requireStaff,
  spreadsheetUpload.single("file"),
  previewImportTradeMasters
);
tradeMastersRouter.post("/import", requireStaff, spreadsheetUpload.single("file"), importTradeMasters);
