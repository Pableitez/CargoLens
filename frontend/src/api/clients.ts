import { api } from "./client.js";
import type { PaginatedResponse } from "./listQuery";
import { fetchAllPages } from "./listQuery";

export type ClientListParams = {
  skip?: number;
  limit?: number;
};

export type ContractualClient = {
  id: string;
  name: string;
  code: string;
  contractualTier?: "primary" | "subsidiary";
  parentClientId?: string | null;
  parentClientName?: string | null;
  savedContainerCount?: number;
  inviteCode?: string;
  createdAt?: string;
};

export async function fetchClientsPage(params: ClientListParams = {}) {
  const { data } = await api.get<PaginatedResponse<ContractualClient>>("/clients", { params });
  return data;
}

export async function fetchClients(params: ClientListParams = {}) {
  if (params.skip !== undefined || params.limit !== undefined) {
    const page = await fetchClientsPage(params);
    return page.items;
  }
  return fetchAllPages((skip, limit) => fetchClientsPage({ skip, limit }));
}

export async function fetchClientProfile(id: string) {
  const { data } = await api.get<{ item: Record<string, unknown> }>(`/clients/${id}`);
  return data.item;
}

export async function createClient(body: Record<string, unknown>) {
  const { data } = await api.post<{ item: ContractualClient }>("/clients", body);
  return data.item;
}

export async function updateClient(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<{ item: Record<string, unknown> }>(`/clients/${id}`, body);
  return data.item;
}

export async function removeClient(id: string) {
  await api.delete(`/clients/${id}`);
}
