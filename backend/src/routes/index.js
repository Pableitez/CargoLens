import { Router } from "express";
import { activityRouter } from "./activity.routes.js";
import { authRouter } from "./auth.routes.js";
import { clientsRouter } from "./clients.routes.js";
import { containersRouter } from "./containers.routes.js";
import { trackingRouter } from "./tracking.routes.js";
import { vesselsRouter } from "./vessels.routes.js";

export const apiRouter = Router();

// Rutas públicas (sin auth): tracking + vessels.
apiRouter.use("/track", trackingRouter);
apiRouter.use("/vessels", vesselsRouter);

apiRouter.use("/auth", authRouter);
apiRouter.use("/containers", containersRouter);
apiRouter.use("/clients", clientsRouter);
apiRouter.use("/activity", activityRouter);
