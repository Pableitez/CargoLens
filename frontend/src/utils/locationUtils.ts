import { LOCATION_CATALOG, type LocationRecord } from "../data/locations";

const byCode = new Map(LOCATION_CATALOG.map((location) => [location.code.toUpperCase(), location]));

export function normalizeLocationCode(value: string): string {
  return value.trim().toUpperCase();
}

export function findLocationByCode(value: string): LocationRecord | undefined {
  if (!value.trim()) return undefined;
  return byCode.get(normalizeLocationCode(value));
}

export function formatLocationLabel(value: string, emptyFallback = "—"): string {
  const trimmed = value.trim();
  if (!trimmed) return emptyFallback;
  const location = findLocationByCode(trimmed);
  if (location) return `${location.name} (${location.code})`;
  return trimmed;
}

export function locationSearchText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const location = findLocationByCode(trimmed);
  if (location) return `${location.code} ${location.name} ${location.country}`;
  return trimmed;
}

export function searchLocations(query: string, limit = 12): LocationRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCATION_CATALOG.slice(0, limit);

  return LOCATION_CATALOG.filter(
    (location) =>
      location.code.toLowerCase().includes(q) ||
      location.name.toLowerCase().includes(q) ||
      location.country.toLowerCase().includes(q)
  ).slice(0, limit);
}

export function resolveLocationCode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const byExactCode = findLocationByCode(trimmed);
  if (byExactCode) return byExactCode.code;

  const byLabel = LOCATION_CATALOG.find(
    (location) => formatLocationLabel(location.code).toLowerCase() === trimmed.toLowerCase()
  );
  if (byLabel) return byLabel.code;

  const byName = LOCATION_CATALOG.find((location) => location.name.toLowerCase() === trimmed.toLowerCase());
  if (byName) return byName.code;

  return "";
}

export function locationFacetValue(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return [formatLocationLabel(trimmed)];
}
