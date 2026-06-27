import { api } from "./client.js";

export async function fetchTrackingByQuery(q: string) {
  const { data } = await api.get<Record<string, unknown>>("/track/search", { params: { q } });
  return data;
}
