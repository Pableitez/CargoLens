import { describe, expect, it } from "@jest/globals";
import { parseShipmentImportRow } from "./shipmentImport.js";

describe("parseShipmentImportRow", () => {
  it("parses a valid Spanish header row", () => {
    const parsed = parseShipmentImportRow(
      {
        Referencia: "EMB-001",
        Origen: "Valencia",
        Destino: "Rotterdam",
        Estado: "in_transit",
        Contenedor: "MSCU1234567",
      },
      0
    );
    expect(parsed.valid).toBe(true);
    expect(parsed.payload.reference).toBe("EMB-001");
    expect(parsed.payload.containers[0].containerNumber).toBe("MSCU1234567");
  });

  it("flags missing reference", () => {
    const parsed = parseShipmentImportRow({ Origen: "Valencia" }, 1);
    expect(parsed.valid).toBe(false);
    expect(parsed.errors.some((e) => e.includes("reference"))).toBe(true);
  });
});
