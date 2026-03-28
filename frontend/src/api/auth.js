import { api, setAuthToken } from "./client.js";

export async function register(body) {
  const { data } = await api.post("/auth/register", body);
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function login(body) {
  const { data } = await api.post("/auth/login", body);
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export function logout() {
  setAuthToken(null);
}
