import { Router } from "express";
import { listActivity } from "../controllers/activityController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const activityRouter = Router();

activityRouter.use(requireAuth, requireStaff);
activityRouter.get("/", listActivity);
