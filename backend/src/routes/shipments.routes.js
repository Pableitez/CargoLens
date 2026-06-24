import multer from "multer";
import { Router } from "express";
import {
  createShareLink,
  createShipment,
  createShipmentEventHandler,
  deleteShipment,
  getPublicShipment,
  getShipment,
  downloadShipmentImportTemplate,
  importShipments,
  listShipmentEventsHandler,
  listShipments,
  previewImportShipments,
  revokeShareLink,
  updateShipment,
} from "../controllers/shipmentsController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});

export const shipmentsRouter = Router();
export const publicShipmentsRouter = Router();

shipmentsRouter.use(requireAuth);
shipmentsRouter.get("/import/template", requireStaff, downloadShipmentImportTemplate);
shipmentsRouter.post("/import/preview", requireStaff, upload.single("file"), previewImportShipments);
shipmentsRouter.post("/import", requireStaff, upload.single("file"), importShipments);
shipmentsRouter.get("/", listShipments);
shipmentsRouter.get("/:id/events", listShipmentEventsHandler);
shipmentsRouter.post("/:id/events", requireStaff, createShipmentEventHandler);
shipmentsRouter.get("/:id", getShipment);
shipmentsRouter.post("/", requireStaff, createShipment);
shipmentsRouter.patch("/:id", requireStaff, updateShipment);
shipmentsRouter.delete("/:id", requireStaff, deleteShipment);
shipmentsRouter.post("/:id/share-links", requireStaff, createShareLink);
shipmentsRouter.delete("/:id/share-links/:linkId", requireStaff, revokeShareLink);

publicShipmentsRouter.get("/shipments/:token", getPublicShipment);
