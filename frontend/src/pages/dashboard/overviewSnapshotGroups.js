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

/** Acordeón: o todos abiertos o solo el primero según modo “heavy”. */
export function useAccordionBootstrap(groups, heavyAccordion, groupNamesKey, setExpanded) {
  useLayoutEffect(() => {
    if (!heavyAccordion) {
      setExpanded(new Set(groups.map((g) => g.clientName)));
      return;
    }
    setExpanded(new Set(groups[0]?.clientName ? [groups[0].clientName] : []));
  }, [groupNamesKey, heavyAccordion, groups, setExpanded]);
}
