export const TRADE_MASTERS_IMPORT_KINDS = ["parties", "facilities", "related_parties", "related_facilities"];

const KIND_ALIASES = {
  parties: "parties",
  facilities: "facilities",
  "related-parties": "related_parties",
  related_parties: "related_parties",
  "related-facilities": "related_facilities",
  related_facilities: "related_facilities",
};

export function normalizeImportKind(value) {
  if (!value) return null;
  return KIND_ALIASES[String(value).trim().toLowerCase()] ?? null;
}

export function importKindToSlug(kind) {
  return kind.replace(/_/g, "-");
}
