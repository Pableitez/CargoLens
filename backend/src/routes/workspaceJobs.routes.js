import { Router } from "express";
import { spreadsheetUpload } from "../config/upload.js";
import {
  enqueueImportJob,
  getWorkspaceJob,
  listWorkspaceJobs,
  markWorkspaceJobsRead,
} from "../controllers/workspaceJobsController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const workspaceJobsRouter = Router();

workspaceJobsRouter.use(requireAuth, requireStaff);

workspaceJobsRouter.get("/", listWorkspaceJobs);
workspaceJobsRouter.get("/:id", getWorkspaceJob);
workspaceJobsRouter.post("/imports", spreadsheetUpload.single("file"), enqueueImportJob);
workspaceJobsRouter.post("/mark-read", markWorkspaceJobsRead);
