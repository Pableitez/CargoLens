import catalog from "../../../shared/location-catalog.json" with { type: "json" };

export const LOCATION_CATALOG = catalog;

const byCode = new Map(
  LOCATION_CATALOG.map((location) => [String(location.code).trim().toUpperCase(), location])
);

export function normalizeLocationCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

export function findLocationByCode(value) {
  const code = normalizeLocationCode(value);
  if (!code) return undefined;
  return byCode.get(code);
}

export function isKnownLocationCode(value) {
  if (!String(value ?? "").trim()) return true;
  return Boolean(findLocationByCode(value));
}

export function normalizeLocationField(value, fieldLabel = "location") {
  const raw = String(value ?? "").trim();
  if (!raw) return { ok: true, code: "" };
  const location = findLocationByCode(raw);
  if (!location) {
    return {
      ok: false,
      error: `${fieldLabel} must be a known UN/LOCODE from the catalog (received "${raw}")`,
    };
  }
  return { ok: true, code: location.code };
}

export function searchLocations(query, limit = 12) {
  const q = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!q) return LOCATION_CATALOG.slice(0, limit);
  return LOCATION_CATALOG.filter(
    (location) =>
      location.code.toLowerCase().includes(q) ||
      location.name.toLowerCase().includes(q) ||
      location.country.toLowerCase().includes(q)
  ).slice(0, limit);
}

export const ORDER_LOCATION_FIELDS = Object.freeze([
  "placeOfReceipt",
  "portOfLoading",
  "portOfDischarge",
  "placeOfDelivery",
]);

export const BOOKING_LOCATION_FIELDS = Object.freeze([...ORDER_LOCATION_FIELDS, "incotermLocation"]);
