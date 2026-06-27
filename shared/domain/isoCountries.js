/** ISO 3166-1 alpha-2 codes commonly used in trade (sorted by English name). */
export const ISO_COUNTRIES = Object.freeze([
  { code: "AR", nameEn: "Argentina", nameEs: "Argentina" },
  { code: "AU", nameEn: "Australia", nameEs: "Australia" },
  { code: "BE", nameEn: "Belgium", nameEs: "Bélgica" },
  { code: "BR", nameEn: "Brazil", nameEs: "Brasil" },
  { code: "CA", nameEn: "Canada", nameEs: "Canadá" },
  { code: "CL", nameEn: "Chile", nameEs: "Chile" },
  { code: "CN", nameEn: "China", nameEs: "China" },
  { code: "CO", nameEn: "Colombia", nameEs: "Colombia" },
  { code: "DE", nameEn: "Germany", nameEs: "Alemania" },
  { code: "DK", nameEn: "Denmark", nameEs: "Dinamarca" },
  { code: "EG", nameEn: "Egypt", nameEs: "Egipto" },
  { code: "ES", nameEn: "Spain", nameEs: "España" },
  { code: "FI", nameEn: "Finland", nameEs: "Finlandia" },
  { code: "FR", nameEn: "France", nameEs: "Francia" },
  { code: "GB", nameEn: "United Kingdom", nameEs: "Reino Unido" },
  { code: "GR", nameEn: "Greece", nameEs: "Grecia" },
  { code: "HK", nameEn: "Hong Kong", nameEs: "Hong Kong" },
  { code: "ID", nameEn: "Indonesia", nameEs: "Indonesia" },
  { code: "IN", nameEn: "India", nameEs: "India" },
  { code: "IT", nameEn: "Italy", nameEs: "Italia" },
  { code: "JP", nameEn: "Japan", nameEs: "Japón" },
  { code: "KR", nameEn: "South Korea", nameEs: "Corea del Sur" },
  { code: "LK", nameEn: "Sri Lanka", nameEs: "Sri Lanka" },
  { code: "MX", nameEn: "Mexico", nameEs: "México" },
  { code: "MY", nameEn: "Malaysia", nameEs: "Malasia" },
  { code: "NG", nameEn: "Nigeria", nameEs: "Nigeria" },
  { code: "NL", nameEn: "Netherlands", nameEs: "Países Bajos" },
  { code: "NO", nameEn: "Norway", nameEs: "Noruega" },
  { code: "PE", nameEn: "Peru", nameEs: "Perú" },
  { code: "PH", nameEn: "Philippines", nameEs: "Filipinas" },
  { code: "PL", nameEn: "Poland", nameEs: "Polonia" },
  { code: "PT", nameEn: "Portugal", nameEs: "Portugal" },
  { code: "SE", nameEn: "Sweden", nameEs: "Suecia" },
  { code: "SG", nameEn: "Singapore", nameEs: "Singapur" },
  { code: "TH", nameEn: "Thailand", nameEs: "Tailandia" },
  { code: "TR", nameEn: "Turkey", nameEs: "Turquía" },
  { code: "TW", nameEn: "Taiwan", nameEs: "Taiwán" },
  { code: "US", nameEn: "United States", nameEs: "Estados Unidos" },
  { code: "VN", nameEn: "Vietnam", nameEs: "Vietnam" },
  { code: "ZA", nameEn: "South Africa", nameEs: "Sudáfrica" },
]);

export function findIsoCountry(code) {
  const normalized = String(code ?? "")
    .trim()
    .toUpperCase();
  return ISO_COUNTRIES.find((row) => row.code === normalized);
}

/** Map ISO code or legacy country name to a 2-letter ISO code for selectors. */
export function resolveIsoCountryCode(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  const lower = raw.toLowerCase();
  const match = ISO_COUNTRIES.find(
    (row) => row.nameEn.toLowerCase() === lower || row.nameEs.toLowerCase() === lower
  );
  return match?.code ?? "";
}

/** Resolve free-text search to an ISO country code (exact or prefix match on name/code). */
export function resolveIsoCountryCodeFromQuery(query) {
  const raw = String(query ?? "").trim();
  if (!raw) return "";
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  const lower = raw.toLowerCase();
  const exact = ISO_COUNTRIES.find(
    (row) =>
      row.code.toLowerCase() === lower ||
      row.nameEn.toLowerCase() === lower ||
      row.nameEs.toLowerCase() === lower
  );
  if (exact) return exact.code;
  const prefix = ISO_COUNTRIES.find(
    (row) => row.nameEn.toLowerCase().startsWith(lower) || row.nameEs.toLowerCase().startsWith(lower)
  );
  return prefix?.code ?? "";
}

export function formatIsoCountryLabel(code, locale = "en") {
  const row = findIsoCountry(code);
  if (!row) return String(code ?? "").trim();
  const nameKey = String(locale).startsWith("es") ? "nameEs" : "nameEn";
  return `${row[nameKey]} (${row.code})`;
}

export function searchIsoCountries(query, locale = "en") {
  const q = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!q) return [...ISO_COUNTRIES];
  return ISO_COUNTRIES.filter(
    (row) =>
      row.code.toLowerCase().includes(q) ||
      row.nameEn.toLowerCase().includes(q) ||
      row.nameEs.toLowerCase().includes(q)
  );
}

/** Human-readable country for display (e.g. "España (ES)"). Falls back to raw value when unknown. */
export function formatCountryLabel(value, locale = "en") {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const nameKey = String(locale).startsWith("es") ? "nameEs" : "nameEn";
  const code = resolveIsoCountryCode(raw);
  if (code) {
    const row = findIsoCountry(code);
    if (row) return `${row[nameKey]} (${code})`;
    return code;
  }
  return raw;
}
