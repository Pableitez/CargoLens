import { Router } from "express";
import { listLocations } from "../controllers/locationsController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const locationsRouter = Router();

locationsRouter.use(requireAuth, requireStaff);
locationsRouter.get("/", listLocations);
