import { Router } from "express";
import {
  createCase,
  createCaseEventHandler,
  deleteCase,
  getCase,
  listCaseEventsHandler,
  listCases,
  updateCase,
} from "../controllers/casesController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const casesRouter = Router();

casesRouter.use(requireAuth);
casesRouter.get("/", listCases);
casesRouter.get("/:id/events", listCaseEventsHandler);
casesRouter.post("/:id/events", requireStaff, createCaseEventHandler);
casesRouter.get("/:id", getCase);
casesRouter.post("/", requireStaff, createCase);
casesRouter.patch("/:id", requireStaff, updateCase);
casesRouter.delete("/:id", requireStaff, deleteCase);
