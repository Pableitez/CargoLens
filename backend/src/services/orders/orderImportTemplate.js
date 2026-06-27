import XLSX from "xlsx";

export const ORDER_IMPORT_HEADERS = [
  "order_number",
  "external_business_identifier",
  "contractual_code",
  "operating_shipper_code",
  "operating_consignee_code",
  "shipping_window_start",
  "shipping_window_end",
  "transport_mode",
  "place_of_receipt",
  "port_of_loading",
  "port_of_discharge",
  "place_of_delivery",
  "incoterm",
  "customer_order_line_key",
  "sku_number",
  "description_of_goods",
  "quantity",
  "uom",
  "commodity_country_of_origin",
  "total_gross_weight",
  "total_cbm",
];

const TEMPLATE_EXAMPLE = [
  "ORD-2026-001",
  "ERP-8842",
  "ACME-CORP",
  "SHP-FACT-HN",
  "CNE-STORE-NY",
  "2026-07-01",
  "2026-07-15",
  "ocean",
  "Valencia",
  "ESVLC",
  "NLRTM",
  "Rotterdam",
  "FOB",
  "LINE-001",
  "SKU-100",
  "Widget A",
  "120",
  "pcs",
  "ES",
  "480",
  "2.4",
];

export function buildOrderImportTemplateBuffer() {
  const sheet = XLSX.utils.aoa_to_sheet([ORDER_IMPORT_HEADERS, TEMPLATE_EXAMPLE]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "orders");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export const ORDER_IMPORT_TEMPLATE_FILENAME = "orders-plantilla.xlsx";
