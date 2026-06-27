import { api } from "./client.js";

export type ActivityListParams = {
  limit?: number;
  skip?: number;
};

export async function fetchWorkspaceActivity(params: ActivityListParams = {}) {
  const { data } = await api.get<{ items: Record<string, unknown>[] }>("/activity", { params });
  return data.items;
}
