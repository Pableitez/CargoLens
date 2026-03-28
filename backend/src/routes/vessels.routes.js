import { Router } from "express";
import { getVesselSearch, getVesselsFromContainers } from "../controllers/vesselsController.js";
import { requireAuth } from "../middleware/auth.js";

export const vesselsRouter = Router();

// Buques derivados de contenedores guardados (requiere sesión).
vesselsRouter.get("/from-containers", requireAuth, getVesselsFromContainers);

// Búsqueda pública de buques (misma clave API que tracking si está configurada).
vesselsRouter.get("/search", getVesselSearch);
