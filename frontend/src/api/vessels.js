import { api } from "./client.js";

export async function searchVessels(q) {
  const { data } = await api.get("/vessels/search", { params: { q } });
  return data;
}

// Con sesión: buques derivados del tracking de contenedores guardados.
export async function getVesselsFromSavedContainers() {
  const { data } = await api.get("/vessels/from-containers");
  return data;
}
