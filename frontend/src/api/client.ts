import axios from "axios";

function normalizeApiBaseURL(url: string) {
  const trimmed = String(url).trim().replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/$/, "") || "";
    if (path === "" || path === "/") {
      return `${u.origin}/api`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function resolveApiBaseURL() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw != null && String(raw).trim() !== "") {
    return normalizeApiBaseURL(String(raw));
  }
  if (import.meta.env.DEV) {
    return "/api";
  }
  throw new Error(
    "[NaoLab] Falta VITE_API_BASE_URL en el build. En Cloudflare Pages → Variables (Production) pon la URL absoluta del API, " +
      "p. ej. VITE_API_BASE_URL=https://tu-servicio.onrender.com/api (sin barra final) y redeploy."
  );
}

const baseURL = resolveApiBaseURL();

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

/** @deprecated Session is stored in an httpOnly cookie; kept for compatibility with legacy callers. */
export function setAuthToken(_token: string | null) {
  // no-op
}

/** @deprecated Session is stored in an httpOnly cookie. */
export function getAuthToken() {
  return null;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);
