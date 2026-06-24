import { describe, expect, it } from "@jest/globals";
import XLSX from "xlsx";
import { buildShipmentImportTemplateBuffer } from "./shipmentImportTemplate.js";

describe("buildShipmentImportTemplateBuffer", () => {
  it("generates a readable xlsx with header and example row", () => {
    const buffer = buildShipmentImportTemplateBuffer();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets.embarques;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    expect(rows[0]).toContain("reference");
    expect(rows[1][0]).toBe("EMB-001");
  });
});
