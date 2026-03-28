import { Router } from "express";
import { createClient, deleteClient, listClients, updateClient } from "../controllers/clientsController.js";
import { requireAuth, requireStaff } from "../middleware/auth.js";

export const clientsRouter = Router();

clientsRouter.use(requireAuth, requireStaff);
clientsRouter.get("/", listClients);
clientsRouter.post("/", createClient);
clientsRouter.patch("/:id", updateClient);
clientsRouter.delete("/:id", deleteClient);
