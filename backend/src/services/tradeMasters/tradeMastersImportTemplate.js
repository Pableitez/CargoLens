import XLSX from "xlsx";
import mongoose from "mongoose";
import { normalizeTradeCode } from "../../../../shared/domain/tradeMasters.js";
import { Facility } from "../../models/Facility.js";
import { Party } from "../../models/Party.js";

export const PARTY_IMPORT_HEADERS = ["be_code", "party", "country", "city", "address", "vat", "notes"];

export const FACILITY_IMPORT_HEADERS = ["code", "name", "line1", "city", "country", "postal_code", "notes"];

export const RELATED_PARTY_IMPORT_HEADERS = [
  "party_be_code",
  "related_party_be_code",
  "relationship_type",
  "notes",
];

export const RELATED_FACILITY_IMPORT_HEADERS = ["party_be_code", "facility_code", "purpose", "notes"];

const PARTY_EXAMPLE = ["ESINDITHQ", "Inditex SA", "ES", "Arteixo", "Edificio Inditex", "ESA12345678", ""];
const FACILITY_EXAMPLE = [
  "ESVALWHS",
  "Valencia export warehouse",
  "Polígono Fuente del Jarro",
  "Valencia",
  "ES",
  "",
  "",
];
const RELATED_PARTY_EXAMPLE = ["ESINDITHQ", "VNHANOIWH", "consignee", "Main consignee on export lane"];
const RELATED_FACILITY_EXAMPLE = ["VNHANOIWH", "ESVCITRM", "ships_from", "Primary export site"];

const INSTRUCTIONS_BY_KIND = {
  parties: [
    ["Sección", "Instrucciones — parties"],
    [
      "Pasos",
      "1) Descarga plantilla o exporta parties actuales. 2) Edita la hoja parties (no cambies cabeceras). 3) Sube el archivo en Clients → Parties → Importar parties.",
    ],
    [
      "Actualizar",
      "Si el be_code ya existe, la fila actualiza la party operativa. Parties contractuales no se modifican por Excel.",
    ],
    [
      "Columnas",
      "Obligatorio: be_code (9 chars: 2 país ISO + 5 nombre + 2 función, ej. ESINDITHQ), party, vat. Opcional: country, city, address, notes.",
    ],
    ["Ejemplo", "Borra o sustituye la fila de ejemplo antes de importar."],
    ["instructions", "Esta hoja no importa datos — puedes dejarla al subir."],
  ],
  facilities: [
    ["Sección", "Instrucciones — facilities"],
    [
      "Pasos",
      "1) Descarga plantilla o exporta instalaciones manuales. 2) Edita la hoja facilities. 3) Sube en Clients → Facilities → Importar facilities.",
    ],
    [
      "Actualizar",
      "Si el code ya existe, se actualiza. Puertos UN/LOCODE no se editan aquí (vienen del catálogo).",
    ],
    [
      "Columnas",
      "Obligatorio: code (8 chars CC+LLL+FFF, ej. ESVALWHS), name. Opcional: line1, city, country, postal_code, notes. Puertos TRM vienen del catálogo.",
    ],
    ["Ejemplo", "Borra o sustituye la fila de ejemplo antes de importar."],
    ["instructions", "Esta hoja no importa datos — puedes dejarla al subir."],
  ],
  related_parties: [
    ["Sección", "Instrucciones — related_parties"],
    [
      "Pasos",
      "1) Descarga plantilla o exporta vínculos actuales. 2) Edita related_parties. 3) Sube en Clients → Parties → Importar vínculos party.",
    ],
    [
      "Actualizar",
      "Si el vínculo party_alias → related_party_alias ya existe, se actualizan relationship_type y notes.",
    ],
    [
      "Columnas",
      "party_be_code, related_party_be_code, relationship_type (shipper, consignee, notify, buyer, forwarder, parent, subsidiary, affiliate, agent, broker, other), notes.",
    ],
    ["Ejemplo", "Ambos codes deben existir como parties en tu cuenta."],
    ["instructions", "Esta hoja no importa datos — puedes dejarla al subir."],
  ],
  related_facilities: [
    ["Sección", "Instrucciones — related_facilities"],
    [
      "Pasos",
      "1) Descarga plantilla o exporta vínculos actuales. 2) Edita related_facilities. 3) Sube en Clients → Parties → Importar vínculos instalación.",
    ],
    ["Actualizar", "Si party_be_code + facility_code ya están vinculados, se actualizan purpose y notes."],
    [
      "Columnas",
      "party_be_code, facility_code, purpose (operates, ships_from, receives_at, billing, other), notes.",
    ],
    ["Ejemplo", "facility_code puede ser manual o puerto UN/LOCODE ya en catálogo."],
    ["instructions", "Esta hoja no importa datos — puedes dejarla al subir."],
  ],
};

const KIND_META = {
  parties: {
    headers: PARTY_IMPORT_HEADERS,
    example: PARTY_EXAMPLE,
    templateFilename: "parties-plantilla.xlsx",
    exportFilename: "parties-export.xlsx",
  },
  facilities: {
    headers: FACILITY_IMPORT_HEADERS,
    example: FACILITY_EXAMPLE,
    templateFilename: "facilities-plantilla.xlsx",
    exportFilename: "facilities-export.xlsx",
  },
  related_parties: {
    headers: RELATED_PARTY_IMPORT_HEADERS,
    example: RELATED_PARTY_EXAMPLE,
    templateFilename: "related-parties-plantilla.xlsx",
    exportFilename: "related-parties-export.xlsx",
  },
  related_facilities: {
    headers: RELATED_FACILITY_IMPORT_HEADERS,
    example: RELATED_FACILITY_EXAMPLE,
    templateFilename: "related-facilities-plantilla.xlsx",
    exportFilename: "related-facilities-export.xlsx",
  },
};

function appendInstructionsSheet(workbook, kind) {
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(INSTRUCTIONS_BY_KIND[kind]), "instructions");
}

function appendKindDataSheet(workbook, kind, rows) {
  const meta = KIND_META[kind];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([meta.headers, ...rows]), kind);
}

export function buildKindImportTemplateBuffer(kind) {
  const meta = KIND_META[kind];
  const workbook = XLSX.utils.book_new();
  appendInstructionsSheet(workbook, kind);
  appendKindDataSheet(workbook, kind, [meta.example]);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function kindTemplateFilename(kind) {
  return KIND_META[kind].templateFilename;
}

export function kindExportFilename(kind) {
  return KIND_META[kind].exportFilename;
}

async function exportRowsForKind(kind, companyId) {
  const companyOid = new mongoose.Types.ObjectId(companyId);

  if (kind === "parties") {
    const partyDocs = await Party.find({ companyId: companyOid, accountTier: { $ne: "contractual" } })
      .select("code legalName country city address vat notes accountTier")
      .sort({ code: 1 })
      .lean();
    const operational = partyDocs.filter((p) => (p.accountTier ?? "operational") === "operational");
    return operational.map((p) => [
      p.code ?? "",
      p.legalName ?? "",
      p.country ?? "",
      p.city ?? "",
      p.address ?? "",
      p.vat ?? "",
      p.notes ?? "",
    ]);
  }

  if (kind === "facilities") {
    const facilityDocs = await Facility.find({
      companyId: companyOid,
      catalogSource: { $ne: "unloc" },
    })
      .sort({ code: 1 })
      .lean();
    return facilityDocs.map((f) => [
      f.code ?? "",
      f.name ?? "",
      f.line1 ?? "",
      f.city ?? "",
      f.country ?? "",
      f.postalCode ?? "",
      f.notes ?? "",
    ]);
  }

  const allParties = await Party.find({ companyId: companyOid })
    .select("code legalName accountTier relatedParties relatedFacilities")
    .sort({ code: 1 })
    .lean();
  const partyById = new Map(allParties.map((p) => [String(p._id), p]));
  const partyDocs = allParties.filter((p) => (p.accountTier ?? "operational") === "operational");

  if (kind === "related_parties") {
    const rows = [];
    for (const party of partyDocs) {
      for (const link of party.relatedParties ?? []) {
        const related = partyById.get(String(link.relatedPartyId));
        if (!related) continue;
        rows.push([party.code ?? "", related.code ?? "", link.relationshipType ?? "", link.notes ?? ""]);
      }
    }
    return rows;
  }

  const allFacilityCodes = await Facility.find({ companyId: companyOid }).select("code").lean();
  const facilityById = new Map(allFacilityCodes.map((f) => [String(f._id), f]));
  const rows = [];
  for (const party of partyDocs) {
    for (const link of party.relatedFacilities ?? []) {
      const facility = facilityById.get(String(link.facilityId));
      if (!facility) continue;
      rows.push([party.code ?? "", facility.code ?? "", link.purpose ?? "operates", link.notes ?? ""]);
    }
  }
  return rows;
}

export async function buildKindExportBuffer(kind, companyId) {
  const rows = await exportRowsForKind(kind, companyId);
  const workbook = XLSX.utils.book_new();
  appendInstructionsSheet(workbook, kind);
  appendKindDataSheet(workbook, kind, rows);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/** Combined workbook instructions (legacy endpoint) */
const COMBINED_INSTRUCTIONS_ROWS = [
  ["Sección", "Instrucciones"],
  [
    "Nota",
    "Prefer separate imports: parties, facilities, related_parties, related_facilities — each has its own import page in the app.",
  ],
  [
    "Actualizar",
    "Si el alias ya existe, la fila actualiza el registro. Parties contractuales y puertos UN/LOCODE no se editan por Excel.",
  ],
];

function appendCombinedInstructionsSheet(workbook) {
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(COMBINED_INSTRUCTIONS_ROWS), "instructions");
}

/** Combined workbook (legacy) */
function appendAllDataSheets(workbook, { parties, facilities, relatedParties, relatedFacilities }) {
  appendKindDataSheet(workbook, "parties", parties);
  appendKindDataSheet(workbook, "facilities", facilities);
  appendKindDataSheet(workbook, "related_parties", relatedParties);
  appendKindDataSheet(workbook, "related_facilities", relatedFacilities);
}

export function buildTradeMastersImportTemplateBuffer() {
  const workbook = XLSX.utils.book_new();
  appendCombinedInstructionsSheet(workbook);
  appendAllDataSheets(workbook, {
    parties: [PARTY_EXAMPLE],
    facilities: [FACILITY_EXAMPLE],
    relatedParties: [RELATED_PARTY_EXAMPLE],
    relatedFacilities: [RELATED_FACILITY_EXAMPLE],
  });
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export async function buildTradeMastersExportBuffer(companyId) {
  const [parties, facilities, relatedParties, relatedFacilities] = await Promise.all([
    exportRowsForKind("parties", companyId),
    exportRowsForKind("facilities", companyId),
    exportRowsForKind("related_parties", companyId),
    exportRowsForKind("related_facilities", companyId),
  ]);

  const workbook = XLSX.utils.book_new();
  appendCombinedInstructionsSheet(workbook);
  appendAllDataSheets(workbook, { parties, facilities, relatedParties, relatedFacilities });
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export const TRADE_MASTERS_IMPORT_TEMPLATE_FILENAME = "trade-masters-plantilla.xlsx";
export const TRADE_MASTERS_EXPORT_FILENAME = "trade-masters-export.xlsx";

/** @deprecated internal helper for tests */
export function normalizeExportCode(value) {
  return normalizeTradeCode(value);
}
