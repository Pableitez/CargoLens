import type { EntitySearchOption } from "../../components/EntitySearchPicker";

export function partyOptionLabel(code: string, legalName: string): string {
  const name = legalName.trim();
  const c = code.trim();
  if (name && c && name !== c) return `${name} (${c})`;
  return name || c;
}

export function toEntitySearchOption(id: string, code: string, legalName: string): EntitySearchOption {
  return {
    id,
    label: partyOptionLabel(code, legalName),
    meta: code.trim() || undefined,
  };
}

export function filterEntityOptions(options: EntitySearchOption[], query: string): EntitySearchOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((row) => {
    const haystack = [row.label, row.meta ?? "", row.id].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}
