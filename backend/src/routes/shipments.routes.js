import { Router } from "express";
import {
  createShareLink,
  createShipment,
  deleteShipment,
  getPublicShipment,
  getShipment,
  listShipments,
  revokeShareLink,
  updateShipment,
} from "../controllers/shipmentsController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const shipmentsRouter = Router();
export const publicShipmentsRouter = Router();

shipmentsRouter.use(requireAuth);
shipmentsRouter.get("/", listShipments);
shipmentsRouter.get("/:id", getShipment);
shipmentsRouter.post("/", requireStaff, createShipment);
shipmentsRouter.patch("/:id", requireStaff, updateShipment);
shipmentsRouter.delete("/:id", requireStaff, deleteShipment);
shipmentsRouter.post("/:id/share-links", requireStaff, createShareLink);
shipmentsRouter.delete("/:id/share-links/:linkId", requireStaff, revokeShareLink);

publicShipmentsRouter.get("/shipments/:token", getPublicShipment);
