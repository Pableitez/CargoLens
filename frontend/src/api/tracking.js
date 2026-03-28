import { api } from "./client.js";

export async function fetchTrackingByQuery(q) {
  const { data } = await api.get("/track/search", { params: { q } });
  return data;
}
