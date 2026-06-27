import { api } from "./client.js";

export type ContainerListParams = {
  client?: string;
  clientId?: string;
  skip?: number;
  limit?: number;
};

export async function fetchContainers(params: ContainerListParams = {}) {
  const { data } = await api.get<{ items: Record<string, unknown>[] }>("/containers", { params });
  return data.items;
}

export async function fetchContainersOverviewMap() {
  const { data } = await api.get<Record<string, unknown>>("/containers/overview-map");
  return data;
}

export async function saveContainer(body: Record<string, unknown>) {
  const { data } = await api.post<{ item: Record<string, unknown> }>("/containers", body);
  return data.item;
}

export async function updateContainer(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<{ item: Record<string, unknown> }>(`/containers/${id}`, body);
  return data.item;
}

export async function removeContainer(id: string) {
  await api.delete(`/containers/${id}`);
}

export async function importContainersExcel(file: File) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<Record<string, unknown>>("/containers/import", body);
  return data;
}
