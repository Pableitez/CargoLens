import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listFacilityRelationships,
  listPartyRelationships,
} from "../controllers/tradeRelationshipsController.js";

export const tradeRelationshipsRouter = Router();

tradeRelationshipsRouter.use(requireAuth);
tradeRelationshipsRouter.get("/parties", listPartyRelationships);
tradeRelationshipsRouter.get("/facilities", listFacilityRelationships);
