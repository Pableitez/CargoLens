import { Router } from "express";
import { searchTracking } from "../controllers/trackingController.js";
import { optionalAuth } from "../middleware/auth.js";
import { externalApiLimiter } from "../middleware/externalApiLimiter.js";

export const trackingRouter = Router();

trackingRouter.get("/search", externalApiLimiter, optionalAuth, searchTracking);
