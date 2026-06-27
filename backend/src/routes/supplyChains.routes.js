import { Router } from "express";
import { requireAuth, requireStaff } from "../middleware/auth.js";
import {
  createSupplyChain,
  deleteSupplyChain,
  getSupplyChain,
  listSupplyChains,
  updateSupplyChain,
} from "../controllers/supplyChainsController.js";

export const supplyChainsRouter = Router();

supplyChainsRouter.use(requireAuth);
supplyChainsRouter.get("/", listSupplyChains);
supplyChainsRouter.get("/:id", getSupplyChain);
supplyChainsRouter.post("/", requireStaff, createSupplyChain);
supplyChainsRouter.patch("/:id", requireStaff, updateSupplyChain);
supplyChainsRouter.delete("/:id", requireStaff, deleteSupplyChain);
