// Agrupación por cliente compartida entre mapa y snapshot del resumen.
export function overviewClientKey(item) {
  const n = (item.clientName || "").trim();
  return n || "Unassigned";
}

export const UNASSIGNED_FILTER = "__unassigned__";

export function filterOverviewItemsByClient(items, clientFilterKey) {
  const raw = items ?? [];
  if (!clientFilterKey) return raw;
  if (clientFilterKey === UNASSIGNED_FILTER) {
    return raw.filter((it) => !(it.clientName || "").trim());
  }
  return raw.filter((it) => overviewClientKey(it) === clientFilterKey);
}
