import XLSX from "xlsx";

export const SHIPPER_BOOKING_IMPORT_HEADERS = [
  "booking_reference",
  "customer_reference_number",
  "customer",
  "shipper",
  "consignee",
  "cargo_ready_date",
  "expected_receipt_date",
  "expected_delivery_date",
  "transport_mode",
  "place_of_receipt",
  "port_of_loading",
  "port_of_discharge",
  "place_of_delivery",
  "incoterm",
  "incoterm_location",
  "customer_order_number",
  "customer_order_line_key",
  "sku_number",
  "description_of_goods",
  "booked_quantity",
  "quantity_unit",
  "commodity_country_of_origin",
  "booked_volume",
  "booked_weight",
  "external_business_identifier",
];

const TEMPLATE_EXAMPLE = [
  "SB202600001",
  "CUST-REF-8842",
  "Acme Corp",
  "Valencia Warehouse",
  "Rotterdam DC",
  "2026-07-01",
  "2026-07-10",
  "2026-07-25",
  "ocean",
  "Valencia",
  "ESVLC",
  "NLRTM",
  "Rotterdam",
  "FOB",
  "Valencia",
  "ORD-2026-001",
  "LINE-001",
  "SKU-100",
  "Widget A",
  "120",
  "pcs",
  "ES",
  "2.4",
  "480",
  "ERP-8842",
];

export function buildShipperBookingImportTemplateBuffer() {
  const sheet = XLSX.utils.aoa_to_sheet([SHIPPER_BOOKING_IMPORT_HEADERS, TEMPLATE_EXAMPLE]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "shipper_bookings");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export const SHIPPER_BOOKING_IMPORT_TEMPLATE_FILENAME = "shipper-bookings-plantilla.xlsx";
