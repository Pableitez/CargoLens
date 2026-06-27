export function normalizePartyVat(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 32);
}

export function isValidPartyVat(value) {
  const vat = normalizePartyVat(value);
  return vat.length >= 2;
}
