import { Router } from "express";
import { searchTracking } from "../controllers/trackingController.js";
import { optionalAuth } from "../middleware/auth.js";

export const trackingRouter = Router();

trackingRouter.get("/search", optionalAuth, searchTracking);
