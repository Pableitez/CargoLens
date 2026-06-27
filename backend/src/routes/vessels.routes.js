import { Router } from "express";
import { getVesselSearch, getVesselsFromContainers } from "../controllers/vesselsController.js";
import { requireAuth } from "../middleware/auth.js";
import { externalApiLimiter } from "../middleware/externalApiLimiter.js";

export const vesselsRouter = Router();

// Buques derivados de contenedores guardados (requiere sesión).
vesselsRouter.get("/from-containers", requireAuth, getVesselsFromContainers);

// Búsqueda de buques (rate-limited; proxies Sinay when configured).
vesselsRouter.get("/search", externalApiLimiter, getVesselSearch);
