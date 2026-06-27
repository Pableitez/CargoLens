export function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Builds a case-insensitive $or regex filter across string fields. Returns null when query is empty. */
export function buildTextSearchFilter(query, fields) {
  const term = String(query ?? "").trim();
  if (!term || !fields?.length) return null;
  const re = new RegExp(escapeRegex(term), "i");
  return { $or: fields.map((field) => ({ [field]: re })) };
}

export function mergeFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
