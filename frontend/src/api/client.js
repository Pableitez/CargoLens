import axios from "axios";

const TOKEN_KEY = "freightboard_token";

/**
 * En desarrollo: proxy Vite sirve /api → backend local.
 * En producción: debe ser URL absoluta del API (Render, etc.). Si falta, /api relativo
 * apunta al dominio del front (Cloudflare Pages) y devuelve 405 en POST.
 */
function resolveApiBaseURL() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "/api";
  }
  throw new Error(
    "[CargoLens] Falta VITE_API_BASE_URL en el build. En Cloudflare Pages → Variables (Production) pon la URL absoluta del API, " +
      "p. ej. VITE_API_BASE_URL=https://tu-servicio.onrender.com/api (sin barra final) y redeploy."
  );
}

const baseURL = resolveApiBaseURL();

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}
