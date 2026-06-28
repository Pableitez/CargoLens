import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { clientsRouter } from "./clients.routes.js";
import { conversationsRouter } from "./conversations.routes.js";
import { facilitiesRouter } from "./facilities.routes.js";
import { locationsRouter } from "./locations.routes.js";
import { ordersRouter } from "./orders.routes.js";
import { partiesRouter } from "./parties.routes.js";
import { shipperBookingsRouter } from "./shipperBookings.routes.js";
import { carrierBookingsRouter } from "./carrierBookings.routes.js";
import { supplyChainsRouter } from "./supplyChains.routes.js";
import { tradeMastersRouter } from "./tradeMasters.routes.js";
import { workspaceJobsRouter } from "./workspaceJobs.routes.js";
import { tradeRelationshipsRouter } from "./tradeRelationships.routes.js";
import { marketingRouter } from "./marketing.routes.js";

export const apiRouter = Router();

apiRouter.use("/marketing", marketingRouter);

apiRouter.use("/trade-relationships", tradeRelationshipsRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/clients", clientsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/locations", locationsRouter);
apiRouter.use("/parties", partiesRouter);
apiRouter.use("/facilities", facilitiesRouter);
apiRouter.use("/trade-masters", tradeMastersRouter);
apiRouter.use("/jobs", workspaceJobsRouter);
apiRouter.use("/supply-chains", supplyChainsRouter);
apiRouter.use("/shipper-bookings", shipperBookingsRouter);
apiRouter.use("/carrier-bookings", carrierBookingsRouter);
apiRouter.use("/conversations", conversationsRouter);
