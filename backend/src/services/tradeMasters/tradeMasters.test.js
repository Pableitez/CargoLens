import { normalizeTradeCode } from "../../../../shared/domain/tradeMasters.js";

describe("normalizeTradeCode", () => {
  it("uppercases and trims party codes", () => {
    expect(normalizeTradeCode(" shp-fact-hn ")).toBe("SHP-FACT-HN");
  });
});

describe("contractualCodeFromName", () => {
  it("suggests a BE code from legal name", async () => {
    const { contractualCodeFromName } = await import("../../utils/contractualCode.js");
    expect(contractualCodeFromName("Acme Corp")).toBe("XXACMEXHQ");
  });
});
