export function serializeWorkspaceJob(doc) {
  return {
    id: String(doc._id),
    kind: doc.kind,
    status: doc.status,
    fileName: doc.fileName ?? "",
    progressMessage: doc.progressMessage ?? "",
    progressPercent: doc.progressPercent ?? 0,
    result: doc.result ?? null,
    errorMessage: doc.errorMessage ?? "",
    summary: doc.summary ?? "",
    meta: doc.meta ?? {},
    actorEmail: doc.actorEmail || null,
    startedAt: doc.startedAt?.toISOString?.() ?? null,
    completedAt: doc.completedAt?.toISOString?.() ?? null,
    readAt: doc.readAt?.toISOString?.() ?? null,
    createdAt: doc.createdAt?.toISOString?.() ?? null,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}
