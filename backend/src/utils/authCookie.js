import { getEnv } from "../config/env.js";

export const AUTH_COOKIE_NAME = "naolab_session";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res, token) {
  const { nodeEnv } = getEnv();
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
}

export function readAuthToken(req) {
  const fromCookie = req.cookies?.[AUTH_COOKIE_NAME];
  if (fromCookie) return String(fromCookie);

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);

  return null;
}
