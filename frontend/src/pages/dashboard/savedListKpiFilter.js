/** Filtros KPI de la lista guardada (?scope= / ?source=). */

export function filterSavedListByKpi(rows, scope, source) {
  let out = rows;
  if (scope === "assigned") out = out.filter((r) => r.clientId);
  else if (scope === "unassigned") out = out.filter((r) => !r.clientId);
  if (source === "manual") out = out.filter((r) => r.entrySource === "manual");
  else if (source === "import") out = out.filter((r) => r.entrySource === "import");
  else if (source === "seed") out = out.filter((r) => r.entrySource === "seed");
  else if (source === "api") out = out.filter((r) => r.entrySource === "api");
  return out;
}
