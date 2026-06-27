import type { Facility } from "../../api/facilities";
import type { Party } from "../../api/parties";
import { datedExportFilename, downloadCsvFile } from "../../utils/csvExport";

/** Matches backend PARTY_IMPORT_HEADERS for re-import compatibility. */
const PARTY_HEADERS = ["be_code", "party", "country", "city", "address", "vat", "notes"];

/** Matches backend FACILITY_IMPORT_HEADERS for re-import compatibility. */
const FACILITY_HEADERS = ["code", "name", "line1", "city", "country", "postal_code", "notes"];

export function exportFilteredPartiesCsv(rows: Party[]) {
  downloadCsvFile(
    PARTY_HEADERS,
    rows.map((row) => [row.code, row.legalName, row.country, row.city, row.address, row.vat, row.notes]),
    datedExportFilename("parties-export")
  );
}

export function exportFilteredFacilitiesCsv(rows: Facility[]) {
  downloadCsvFile(
    FACILITY_HEADERS,
    rows.map((row) => [row.code, row.name, row.line1, row.city, row.country, row.postalCode, row.notes]),
    datedExportFilename("facilities-export")
  );
}
