import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { resolveCorsOrigin } from "./config/env.js";
import { isDbConnected } from "./db.js";
import { apiRouter } from "./routes/index.js";

// Factory de la app Express: server.js solo hace listen; tests inyectan app.
export function createApp() {
  const app = express();

  app.use(cors({ origin: resolveCorsOrigin(), credentials: true }));
  app.use(express.json());

  const apiLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 400),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests" },
  });

  app.get("/health", (_req, res) => {
    const db = isDbConnected();
    res.json({
      ok: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db: db ? "connected" : "disconnected",
    });
  });

  app.use("/api", apiLimiter, apiRouter);

  return app;
}
