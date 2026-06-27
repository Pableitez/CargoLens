import rateLimit from "express-rate-limit";

/** Stricter limit for routes that proxy paid external APIs (Sinay, etc.). */
export const externalApiLimiter = rateLimit({
  windowMs: Number(process.env.EXTERNAL_API_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  max: Number(process.env.EXTERNAL_API_RATE_LIMIT_MAX ?? 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TOO_MANY_REQUESTS",
    message: "Too many search requests. Try again later.",
  },
});
