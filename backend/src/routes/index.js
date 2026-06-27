import { Router } from "express";
import { activityRouter } from "./activity.routes.js";
import { authRouter } from "./auth.routes.js";
import { clientsRouter } from "./clients.routes.js";
import { containersRouter } from "./containers.routes.js";
import { conversationsRouter } from "./conversations.routes.js";
import { facilitiesRouter } from "./facilities.routes.js";
import { locationsRouter } from "./locations.routes.js";
import { ordersRouter } from "./orders.routes.js";
import { partiesRouter } from "./parties.routes.js";
import { shipperBookingsRouter } from "./shipperBookings.routes.js";
import { supplyChainsRouter } from "./supplyChains.routes.js";
import { tradeMastersRouter } from "./tradeMasters.routes.js";
import { workspaceJobsRouter } from "./workspaceJobs.routes.js";
import { tradeRelationshipsRouter } from "./tradeRelationships.routes.js";
import { trackingRouter } from "./tracking.routes.js";
import { vesselsRouter } from "./vessels.routes.js";

export const apiRouter = Router();

// Rutas públicas (sin auth): tracking + vessels.
apiRouter.use("/trade-relationships", tradeRelationshipsRouter);
apiRouter.use("/track", trackingRouter);
apiRouter.use("/vessels", vesselsRouter);

apiRouter.use("/auth", authRouter);
apiRouter.use("/containers", containersRouter);
apiRouter.use("/clients", clientsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/locations", locationsRouter);
apiRouter.use("/parties", partiesRouter);
apiRouter.use("/facilities", facilitiesRouter);
apiRouter.use("/trade-masters", tradeMastersRouter);
apiRouter.use("/jobs", workspaceJobsRouter);
apiRouter.use("/supply-chains", supplyChainsRouter);
apiRouter.use("/shipper-bookings", shipperBookingsRouter);
apiRouter.use("/activity", activityRouter);
apiRouter.use("/conversations", conversationsRouter);
