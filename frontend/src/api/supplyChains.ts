import { api } from "./client.js";
import type { PaginatedResponse } from "./listQuery";
import { fetchAllPages } from "./listQuery";

export type ChainMember = {
  partyId: string;
  partyCode: string;
  partyLegalName: string;
  relationshipType: string;
  notes: string;
};

export type ChainNode = {
  partyId: string;
  partyCode: string;
  partyLegalName: string;
  role: "shipper" | "consignee" | "notify" | "buyer" | "forwarder";
};

export type SupplyChain = {
  id: string;
  clientId: string;
  primaryPartyId: string | null;
  primaryPartyCode: string;
  primaryPartyName: string;
  code: string;
  name: string;
  direction: "export" | "import" | "domestic";
  primaryRole: "shipper" | "consignee";
  defaultIncoterm: string;
  defaultTransportMode: string;
  defaultPortOfLoading: string;
  defaultPortOfDischarge: string;
  members: ChainMember[];
  /** Operational roles derived from party aliases (import resolution). */
  nodes: ChainNode[];
  createdAt: string;
  updatedAt: string;
};

export type SupplyChainListParams = {
  clientId?: string;
  skip?: number;
  limit?: number;
};

export async function fetchSupplyChainsPage(params: SupplyChainListParams = {}) {
  const { data } = await api.get<PaginatedResponse<SupplyChain>>("/supply-chains", { params });
  return data;
}

export async function fetchSupplyChains(arg: string | SupplyChainListParams = {}): Promise<SupplyChain[]> {
  const params = typeof arg === "string" ? (arg ? { clientId: arg } : {}) : arg;

  if (params.skip !== undefined || params.limit !== undefined) {
    const page = await fetchSupplyChainsPage(params);
    return page.items;
  }
  return fetchAllPages((skip, limit) => fetchSupplyChainsPage({ ...params, skip, limit }));
}

export async function createSupplyChain(body: Record<string, unknown>) {
  const { data } = await api.post<{ item: SupplyChain }>("/supply-chains", body);
  return data.item;
}

export async function updateSupplyChain(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<{ item: SupplyChain }>(`/supply-chains/${id}`, body);
  return data.item;
}

export async function removeSupplyChain(id: string) {
  await api.delete(`/supply-chains/${id}`);
}
