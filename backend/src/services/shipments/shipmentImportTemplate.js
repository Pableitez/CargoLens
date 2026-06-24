import XLSX from "xlsx";

const TEMPLATE_HEADERS = [
  "reference",
  "origin",
  "destination",
  "etd",
  "eta",
  "status",
  "container",
  "client_invite",
];

const TEMPLATE_EXAMPLE = [
  "EMB-001",
  "Valencia",
  "Rotterdam",
  "2026-07-01",
  "2026-07-15",
  "in_transit",
  "MSCU1234567",
  "",
];

export function buildShipmentImportTemplateBuffer() {
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "embarques");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export const SHIPMENT_IMPORT_TEMPLATE_FILENAME = "embarques-plantilla.xlsx";
