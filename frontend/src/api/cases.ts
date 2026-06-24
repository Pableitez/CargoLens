import { api } from "./client.js";
import type { Case, CaseEvent } from "../features/cases/types";

export async function fetchCases(params: { status?: string } = {}): Promise<Case[]> {
  const { data } = await api.get<{ items: Case[] }>("/cases", { params });
  return data.items;
}

export async function fetchCase(id: string): Promise<{ item: Case; events: CaseEvent[] }> {
  const { data } = await api.get<{ item: Case; events: CaseEvent[] }>(`/cases/${id}`);
  return data;
}

export async function createCase(body: Record<string, unknown>): Promise<Case> {
  const { data } = await api.post<{ item: Case }>("/cases", body);
  return data.item;
}

export async function updateCase(id: string, body: Record<string, unknown>): Promise<Case> {
  const { data } = await api.patch<{ item: Case }>(`/cases/${id}`, body);
  return data.item;
}

export async function deleteCase(id: string): Promise<void> {
  await api.delete(`/cases/${id}`);
}

export async function createCaseEvent(
  id: string,
  payload: { kind: "note" | "milestone"; message: string; visibleToClient?: boolean }
): Promise<CaseEvent> {
  const { data } = await api.post<{ item: CaseEvent }>(`/cases/${id}/events`, payload);
  return data.item;
}
