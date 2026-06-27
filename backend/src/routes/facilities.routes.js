import { Router } from "express";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import {
  createFacility,
  createFacilitiesBulk,
  deleteFacility,
  getFacility,
  listFacilities,
  updateFacility,
} from "../controllers/facilitiesController.js";

export const facilitiesRouter = Router();

facilitiesRouter.use(requireAuth);
facilitiesRouter.get("/", listFacilities);
facilitiesRouter.post("/bulk", requireStaff, createFacilitiesBulk);
facilitiesRouter.get("/:id", getFacility);
facilitiesRouter.post("/", requireStaff, createFacility);
facilitiesRouter.patch("/:id", requireStaff, updateFacility);
facilitiesRouter.delete("/:id", requireStaff, deleteFacility);
