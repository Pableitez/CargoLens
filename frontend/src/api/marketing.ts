import { api } from "./client.js";

type PilotLeadBody = {
  email: string;
  companyName: string;
  name?: string;
  locale?: string;
  source?: string;
};

export async function submitPilotLead(body: PilotLeadBody) {
  const { data } = await api.post<{ ok: boolean; updated?: boolean }>("/marketing/pilot-leads", body);
  return data;
}
