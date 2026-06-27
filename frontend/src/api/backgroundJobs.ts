import { api } from "./client.js";

export type WorkspaceJobStatus = "pending" | "running" | "completed" | "failed";

export type WorkspaceJobKind =
  | "import.trade_masters.parties"
  | "import.trade_masters.facilities"
  | "import.trade_masters.related_parties"
  | "import.trade_masters.related_facilities"
  | "import.orders"
  | "import.shipper_bookings";

export type WorkspaceJob = {
  id: string;
  kind: WorkspaceJobKind;
  status: WorkspaceJobStatus;
  fileName: string;
  progressMessage: string;
  progressPercent: number;
  result: Record<string, unknown> | null;
  errorMessage: string;
  summary: string;
  meta: Record<string, unknown>;
  actorEmail: string | null;
  startedAt: string | null;
  completedAt: string | null;
  readAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WorkspaceJobListParams = {
  limit?: number;
  status?: WorkspaceJobStatus;
};

export async function fetchWorkspaceJobs(params: WorkspaceJobListParams = {}) {
  const { data } = await api.get<{ items: WorkspaceJob[] }>("/jobs", { params });
  return data.items;
}

export async function fetchWorkspaceJob(id: string) {
  const { data } = await api.get<{ item: WorkspaceJob }>(`/jobs/${id}`);
  return data.item;
}

export async function enqueueImportJob(kind: WorkspaceJobKind, file: File) {
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  const { data } = await api.post<{ item: WorkspaceJob }>("/jobs/imports", body);
  return data.item;
}

export async function markWorkspaceJobsRead(ids?: string[]) {
  await api.post("/jobs/mark-read", ids?.length ? { ids } : {});
}

export function tradeMastersJobKind(
  kind: "parties" | "facilities" | "related_parties" | "related_facilities"
): WorkspaceJobKind {
  return `import.trade_masters.${kind}` as WorkspaceJobKind;
}
