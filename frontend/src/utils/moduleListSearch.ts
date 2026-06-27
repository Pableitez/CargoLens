export function filterByModuleSearch<T>(items: T[], query: string, getHaystack: (item: T) => string[]): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  return items.filter((item) => {
    const haystack = getHaystack(item).join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}
