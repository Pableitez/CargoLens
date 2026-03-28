import { api } from "./client.js";

export async function fetchWorkspaceActivity(params = {}) {
  const { data } = await api.get("/activity", { params });
  return data.items;
}
