import { useLayoutEffect } from "react";

export function clientKey(item) {
  const n = (item.clientName || "").trim();
  return n || "Unassigned";
}

/** Agrupa filas snapshot por cliente (orden alfabético por nombre de cliente). */
export function buildClientGroups(filtered, sortLocale) {
  const map = new Map();
  for (const it of filtered) {
    const k = clientKey(it);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  const keys = [...map.keys()].sort((a, b) => a.localeCompare(b, sortLocale));
  return keys.map((clientName) => ({
    clientName,
    items: map.get(clientName),
  }));
}

/** Conjunto de grupos abiertos al cargar: todos o solo el primero (vista “heavy”). */
export function computeAccordionExpansionSet(groups, heavyAccordion) {
  if (!heavyAccordion) {
    return new Set(groups.map((g) => g.clientName));
  }
  return new Set(groups[0]?.clientName ? [groups[0].clientName] : []);
}

/** Acordeón: o todos abiertos o solo el primero según modo “heavy”. */
export function useAccordionBootstrap(groups, heavyAccordion, groupNamesKey, setExpanded) {
  useLayoutEffect(() => {
    setExpanded(computeAccordionExpansionSet(groups, heavyAccordion));
  }, [groupNamesKey, heavyAccordion, groups, setExpanded]);
}
