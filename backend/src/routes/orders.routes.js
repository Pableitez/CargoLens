import { Router } from "express";
import { spreadsheetUpload } from "../config/upload.js";
import {
  createOrder,
  createOrderEventHandler,
  deleteOrder,
  downloadOrderImportTemplate,
  getOrder,
  getOrderBookableLinesHandler,
  getOrderTradeContext,
  getOrderTradeFacilityOptionsHandler,
  getOrderTradePartyOptionsHandler,
  importOrders,
  listOrderEventsHandler,
  listOrders,
  previewImportOrders,
  updateOrder,
} from "../controllers/ordersController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);
ordersRouter.get("/import/template", requireStaff, downloadOrderImportTemplate);
ordersRouter.post("/import/preview", requireStaff, spreadsheetUpload.single("file"), previewImportOrders);
ordersRouter.post("/import", requireStaff, spreadsheetUpload.single("file"), importOrders);
ordersRouter.get("/", listOrders);
ordersRouter.get("/bookable-lines", getOrderBookableLinesHandler);
ordersRouter.get("/trade-context", getOrderTradeContext);
ordersRouter.get("/trade-party-options", getOrderTradePartyOptionsHandler);
ordersRouter.get("/trade-facility-options", getOrderTradeFacilityOptionsHandler);
ordersRouter.get("/:id/events", listOrderEventsHandler);
ordersRouter.post("/:id/events", requireStaff, createOrderEventHandler);
ordersRouter.get("/:id", getOrder);
ordersRouter.post("/", requireStaff, createOrder);
ordersRouter.patch("/:id", requireStaff, updateOrder);
ordersRouter.delete("/:id", requireStaff, deleteOrder);
