import { api } from "./client.js";

export async function searchVessels(q: string) {
  const { data } = await api.get<Record<string, unknown>>("/vessels/search", { params: { q } });
  return data;
}

export async function getVesselsFromSavedContainers() {
  const { data } = await api.get<Record<string, unknown>>("/vessels/from-containers");
  return data;
}
