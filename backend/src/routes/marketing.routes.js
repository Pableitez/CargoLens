import { Router } from "express";
import { createPilotLead } from "../controllers/marketingController.js";

export const marketingRouter = Router();

marketingRouter.post("/pilot-leads", createPilotLead);
