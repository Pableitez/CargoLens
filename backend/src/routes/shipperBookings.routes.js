import { Router } from "express";
import { spreadsheetUpload } from "../config/upload.js";
import {
  createShipperBooking,
  createShipperBookingEventHandler,
  deleteShipperBooking,
  downloadShipperBookingImportTemplate,
  getNextBookingReference,
  getShipperBooking,
  importShipperBookings,
  listShipperBookingEventsHandler,
  listShipperBookings,
  previewImportShipperBookings,
  updateShipperBooking,
} from "../controllers/shipperBookingsController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const shipperBookingsRouter = Router();

shipperBookingsRouter.use(requireAuth);
shipperBookingsRouter.get("/import/template", requireStaff, downloadShipperBookingImportTemplate);
shipperBookingsRouter.post(
  "/import/preview",
  requireStaff,
  spreadsheetUpload.single("file"),
  previewImportShipperBookings
);
shipperBookingsRouter.post("/import", requireStaff, spreadsheetUpload.single("file"), importShipperBookings);
shipperBookingsRouter.get("/", listShipperBookings);
shipperBookingsRouter.get("/next-reference", requireStaff, getNextBookingReference);
shipperBookingsRouter.get("/:id/events", listShipperBookingEventsHandler);
shipperBookingsRouter.post("/:id/events", requireStaff, createShipperBookingEventHandler);
shipperBookingsRouter.get("/:id", getShipperBooking);
shipperBookingsRouter.post("/", requireStaff, createShipperBooking);
shipperBookingsRouter.patch("/:id", requireStaff, updateShipperBooking);
shipperBookingsRouter.delete("/:id", requireStaff, deleteShipperBooking);
