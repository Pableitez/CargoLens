import { api } from "./client.js";

export async function fetchClients() {
  const { data } = await api.get("/clients");
  return data.items;
}

export async function createClient(body) {
  const { data } = await api.post("/clients", body);
  return data.item;
}

export async function updateClient(id, body) {
  const { data } = await api.patch(`/clients/${id}`, body);
  return data.item;
}

export async function removeClient(id) {
  await api.delete(`/clients/${id}`);
}
