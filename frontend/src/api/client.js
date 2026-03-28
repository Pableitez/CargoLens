import axios from "axios";

const TOKEN_KEY = "freightboard_token";

// Producción: VITE_API_BASE_URL = origen del backend, p. ej. https://api.ejemplo.com/api
const baseURL =
  (import.meta.env.VITE_API_BASE_URL &&
    String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")) ||
  "/api";

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
