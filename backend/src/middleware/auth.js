import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";
import { readAuthToken } from "../utils/authCookie.js";

function attachUserFromToken(req, token) {
  const secret = getEnv().jwtSecret;
  if (!secret || !token) return false;

  try {
    const payload = jwt.verify(token, secret);
    const clientId = payload.clientId && String(payload.clientId) !== "null" ? payload.clientId : null;
    req.user = {
      userId: payload.sub,
      companyId: payload.companyId,
      email: payload.email,
      clientId,
    };
    return true;
  } catch {
    return false;
  }
}

// Bearer o cookie httpOnly: si es válido, `req.user`; si no, sigue como invitado.
export function optionalAuth(req, res, next) {
  attachUserFromToken(req, readAuthToken(req));
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

  if (!attachUserFromToken(req, readAuthToken(req))) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Not authenticated." });
  }

  next();
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
