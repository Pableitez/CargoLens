import { describe, expect, it } from "vitest";
import {
  findLocationByCode,
  formatLocationLabel,
  resolveLocationCode,
  searchLocations,
} from "./locationUtils";

describe("locationUtils", () => {
  it("finds catalog entries by UN/LOCODE", () => {
    expect(findLocationByCode("esvlc")?.name).toBe("Valencia");
  });

  it("formats known codes as name + code", () => {
    expect(formatLocationLabel("ESVGO")).toBe("Vigo (ESVGO)");
  });

  it("returns raw text for unknown legacy codes", () => {
    expect(formatLocationLabel("LEGACY-PORT")).toBe("LEGACY-PORT");
  });

  it("resolveLocationCode returns canonical code or empty", () => {
    expect(resolveLocationCode("nlrtm")).toBe("NLRTM");
    expect(resolveLocationCode("Unknown place")).toBe("");
  });

  it("searchLocations matches code, name, or country", () => {
    const results = searchLocations("vigo");
    expect(results.some((entry) => entry.code === "ESVGO")).toBe(true);
  });
});
