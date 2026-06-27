import type { AuthUser } from "./authTypes.js";
import { api } from "./client.js";

type AuthCredentials = {
  email: string;
  password: string;
  [key: string]: unknown;
};

type AuthResponse = {
  user: AuthUser;
};

export async function register(body: AuthCredentials) {
  const { data } = await api.post<AuthResponse>("/auth/register", body);
  return data;
}

export async function login(body: AuthCredentials) {
  const { data } = await api.post<AuthResponse>("/auth/login", body);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Cookie may already be cleared server-side.
  }
}
