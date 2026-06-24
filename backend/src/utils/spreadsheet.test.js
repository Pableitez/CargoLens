import { describe, expect, it } from "@jest/globals";
import { detectCsvDelimiter, readCsvRows } from "./spreadsheet.js";

describe("spreadsheet CSV", () => {
  it("detects semicolon delimiter common in ES locale", () => {
    expect(detectCsvDelimiter("reference;origin;destination")).toBe(";");
    expect(detectCsvDelimiter("reference,origin,destination")).toBe(",");
  });

  it("parses comma-separated CSV with headers", () => {
    const csv = "reference,origin,destination\nEMB-1,Valencia,Rotterdam\n";
    const { sheetName, rows } = readCsvRows(Buffer.from(csv, "utf8"));
    expect(sheetName).toBe("csv");
    expect(rows).toHaveLength(1);
    expect(rows[0].reference).toBe("EMB-1");
    expect(rows[0].origin).toBe("Valencia");
  });

  it("parses semicolon-separated CSV", () => {
    const csv = "referencia;origen;destino\nEMB-2;Barcelona;Hamburgo\n";
    const { rows } = readCsvRows(Buffer.from(csv, "utf8"));
    expect(rows[0].referencia).toBe("EMB-2");
  });
});
