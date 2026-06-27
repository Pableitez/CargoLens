import { Router } from "express";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import {
  createParty,
  createPartiesBulk,
  deleteParty,
  getParty,
  listParties,
  updateParty,
} from "../controllers/partiesController.js";

export const partiesRouter = Router();

partiesRouter.use(requireAuth);
partiesRouter.get("/", listParties);
partiesRouter.post("/bulk", requireStaff, createPartiesBulk);
partiesRouter.get("/:id", getParty);
partiesRouter.post("/", requireStaff, createParty);
partiesRouter.patch("/:id", requireStaff, updateParty);
partiesRouter.delete("/:id", requireStaff, deleteParty);
