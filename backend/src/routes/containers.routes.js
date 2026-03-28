import multer from "multer";
import { Router } from "express";
import {
  createContainer,
  deleteContainer,
  importContainers,
  listContainers,
  updateContainer,
} from "../controllers/containersController.js";
import { overviewMap } from "../controllers/containersOverviewMapController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});

export const containersRouter = Router();

containersRouter.use(requireAuth);

containersRouter.get("/overview-map", overviewMap);
containersRouter.get("/", listContainers);
containersRouter.post("/", requireStaff, createContainer);
containersRouter.post("/import", requireStaff, upload.single("file"), importContainers);
containersRouter.patch("/:id", requireStaff, updateContainer);
containersRouter.delete("/:id", requireStaff, deleteContainer);
