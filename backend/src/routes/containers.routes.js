import { Router } from "express";
import { spreadsheetUpload } from "../config/upload.js";
import {
  createContainer,
  deleteContainer,
  importContainers,
  listContainers,
  updateContainer,
} from "../controllers/containersController.js";
import { overviewMap } from "../controllers/containersOverviewMapController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const containersRouter = Router();

containersRouter.use(requireAuth);

containersRouter.get("/overview-map", overviewMap);
containersRouter.get("/", listContainers);
containersRouter.post("/", requireStaff, createContainer);
containersRouter.post("/import", requireStaff, spreadsheetUpload.single("file"), importContainers);
containersRouter.patch("/:id", requireStaff, updateContainer);
containersRouter.delete("/:id", requireStaff, deleteContainer);
