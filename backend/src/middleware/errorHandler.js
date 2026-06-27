import { devError } from "../utils/devLog.js";

export function notFoundHandler(_req, res) {
  return res.status(404).json({ error: "NOT_FOUND", message: "Route not found." });
}

export function errorHandler(err, _req, res, next) {
  devError(err);
  if (res.headersSent) {
    next(err);
    return;
  }
  return res.status(500).json({ error: "SERVER_ERROR", message: "Unexpected server error." });
}
