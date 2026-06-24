import { api } from "./client.js";
import type { PublicShipment, ShareLinkResult, Shipment } from "../features/shipments/types";

export async function fetchShipments(params: { status?: string } = {}): Promise<Shipment[]> {
  const { data } = await api.get<{ items: Shipment[] }>("/shipments", { params });
  return data.items;
}

export async function fetchShipment(id: string): Promise<Shipment> {
  const { data } = await api.get<{ item: Shipment }>(`/shipments/${id}`);
  return data.item;
}

export async function createShipment(body: Record<string, unknown>): Promise<Shipment> {
  const { data } = await api.post<{ item: Shipment }>("/shipments", body);
  return data.item;
}

export async function updateShipment(id: string, body: Record<string, unknown>): Promise<Shipment> {
  const { data } = await api.patch<{ item: Shipment }>(`/shipments/${id}`, body);
  return data.item;
}

export async function deleteShipment(id: string): Promise<void> {
  await api.delete(`/shipments/${id}`);
}

export async function createShareLink(id: string, expiresInDays = 30): Promise<ShareLinkResult> {
  const { data } = await api.post<ShareLinkResult>(`/shipments/${id}/share-links`, { expiresInDays });
  return data;
}

export async function fetchPublicShipment(token: string): Promise<PublicShipment> {
  const { data } = await api.get<{ item: PublicShipment }>(`/public/shipments/${token}`);
  return data.item;
}
