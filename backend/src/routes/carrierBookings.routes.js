import { Router } from "express";
import {
  createCarrierBooking,
  createCarrierBookingEventHandler,
  deleteCarrierBooking,
  getCarrierBooking,
  getNextCarrierBookingReference,
  listCarrierBookingEventsHandler,
  listCarrierBookings,
  submitCarrierBookingHandler,
  updateCarrierBooking,
} from "../controllers/carrierBookingsController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const carrierBookingsRouter = Router();

carrierBookingsRouter.use(requireAuth);
carrierBookingsRouter.get("/", listCarrierBookings);
carrierBookingsRouter.get("/next-reference", requireStaff, getNextCarrierBookingReference);
carrierBookingsRouter.get("/:id/events", listCarrierBookingEventsHandler);
carrierBookingsRouter.post("/:id/events", requireStaff, createCarrierBookingEventHandler);
carrierBookingsRouter.post("/:id/submit", requireStaff, submitCarrierBookingHandler);
carrierBookingsRouter.get("/:id", getCarrierBooking);
carrierBookingsRouter.post("/", requireStaff, createCarrierBooking);
carrierBookingsRouter.patch("/:id", requireStaff, updateCarrierBooking);
carrierBookingsRouter.delete("/:id", requireStaff, deleteCarrierBooking);
