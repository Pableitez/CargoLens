import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

// Bearer opcional: si es válido, `req.user`; si no, sigue como invitado (rutas públicas con contexto).
export function optionalAuth(req, res, next) {
  const secret = getEnv().jwtSecret;
  if (!secret) return next();

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, secret);
    const clientId = payload.clientId && String(payload.clientId) !== "null" ? payload.clientId : null;
    req.user = {
      userId: payload.sub,
      companyId: payload.companyId,
      email: payload.email,
      clientId,
    };
  } catch {
    // token inválido: invitado
  }
  next();
}

export function requireAuth(req, res, next) {
  const secret = getEnv().jwtSecret;
  if (!secret) {
    return res.status(503).json({
      error: "AUTH_DISABLED",
      message: "Server JWT secret not configured.",
    });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Missing bearer token." });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, secret);
    const clientId = payload.clientId && String(payload.clientId) !== "null" ? payload.clientId : null;
    req.user = {
      userId: payload.sub,
      companyId: payload.companyId,
      email: payload.email,
      clientId,
    };
    next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN", message: "Invalid or expired token." });
  }
}

// Solo cuenta empresa (no portal cliente).
export function requireStaff(req, res, next) {
  if (req.user?.clientId) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "This action requires a company account. Client portal users have read-only access.",
    });
  }
  next();
}
