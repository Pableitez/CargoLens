import { describe, expect, it } from "@jest/globals";
import XLSX from "xlsx";
import {
  buildKindImportTemplateBuffer,
  buildTradeMastersImportTemplateBuffer,
} from "./tradeMastersImportTemplate.js";
import { parseTradeMastersWorkbook, parseTradeMastersWorkbookByKind } from "./tradeMastersImport.js";

describe("tradeMastersImport", () => {
  it("parses combined template sheets (legacy)", () => {
    const buffer = buildTradeMastersImportTemplateBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    expect(workbook.SheetNames[0]).toBe("instructions");
    const parsed = parseTradeMastersWorkbook(workbook);

    expect(parsed.hasAnySheet).toBe(true);
    expect(parsed.parties).toHaveLength(1);
    expect(parsed.facilities).toHaveLength(1);
    expect(parsed.relatedParties).toHaveLength(1);
    expect(parsed.relatedFacilities).toHaveLength(1);
    expect(parsed.parties[0].valid).toBe(true);
    expect(parsed.relatedParties[0].relationshipType).toBe("consignee");
  });

  it("parses parties-only template", () => {
    const buffer = buildKindImportTemplateBuffer("parties");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    expect(workbook.SheetNames).toEqual(["instructions", "parties"]);

    const parsed = parseTradeMastersWorkbookByKind(workbook, "parties");
    expect(parsed.found).toBe(true);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].valid).toBe(true);
  });

  it("parses related-facilities-only template", () => {
    const buffer = buildKindImportTemplateBuffer("related_facilities");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const parsed = parseTradeMastersWorkbookByKind(workbook, "related_facilities");
    expect(parsed.found).toBe(true);
    expect(parsed.rows[0].purpose).toBe("ships_from");
  });
});
