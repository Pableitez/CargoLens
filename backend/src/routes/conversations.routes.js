import { Router } from "express";
import {
  addExternalParticipant,
  listConversations,
  listMessages,
  openConversation,
  postMessage,
} from "../controllers/conversationsController.js";
import { requireAuth } from "../middleware/auth.js";

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);
conversationsRouter.get("/", listConversations);
conversationsRouter.post("/open", openConversation);
conversationsRouter.get("/:id/messages", listMessages);
conversationsRouter.post("/:id/messages", postMessage);
conversationsRouter.post("/:id/external-participants", addExternalParticipant);
