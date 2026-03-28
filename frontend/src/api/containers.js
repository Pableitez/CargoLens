import { api } from "./client.js";

export async function fetchContainers(params = {}) {
  const { data } = await api.get("/containers", { params });
  return data.items;
}

// Payload del mapa + snapshot (sin API masiva; el tracking carga bajo demanda).
export async function fetchContainersOverviewMap() {
  const { data } = await api.get("/containers/overview-map");
  return data;
}

export async function saveContainer(body) {
  const { data } = await api.post("/containers", body);
  return data.item;
}

export async function updateContainer(id, body) {
  const { data } = await api.patch(`/containers/${id}`, body);
  return data.item;
}

export async function removeContainer(id) {
  await api.delete(`/containers/${id}`);
}

export async function importContainersExcel(file) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post("/containers/import", body);
  return data;
}
