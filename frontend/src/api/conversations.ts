import { api } from "./client.js";
import type { PaginatedResponse } from "./listQuery";
import { fetchAllPages } from "./listQuery";

export type ConversationListParams = {
  skip?: number;
  limit?: number;
};

export type Conversation = {
  id: string;
  clientId: string | null;
  clientName: string;
  clientCode: string;
  kind: string;
  subject: string;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  externalParticipantCount: number;
};

export async function fetchConversationsPage(params: ConversationListParams = {}) {
  const { data } = await api.get<PaginatedResponse<Conversation>>("/conversations", { params });
  return data;
}

export async function fetchConversations(params: ConversationListParams = {}) {
  if (params.skip !== undefined || params.limit !== undefined) {
    const page = await fetchConversationsPage(params);
    return page.items;
  }
  return fetchAllPages((skip, limit) => fetchConversationsPage({ skip, limit }));
}

export async function openConversation(clientId: string) {
  const { data } = await api.post<{ item: Conversation }>("/conversations/open", { clientId });
  return data.item;
}

export async function fetchMessages(conversationId: string) {
  const { data } = await api.get<{ items: Record<string, unknown>[] }>(
    `/conversations/${conversationId}/messages`
  );
  return data.items;
}

export async function sendMessage(conversationId: string, body: string) {
  const { data } = await api.post<{ item: Record<string, unknown> }>(
    `/conversations/${conversationId}/messages`,
    { body }
  );
  return data.item;
}

export async function inviteExternalContact(
  conversationId: string,
  payload: { email: string; name?: string }
) {
  const { data } = await api.post<{ item: { externalParticipants?: Record<string, unknown>[] } }>(
    `/conversations/${conversationId}/external-participants`,
    payload
  );
  return data.item;
}
