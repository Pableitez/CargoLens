import { describe, expect, it } from "@jest/globals";
import { findLocationByCode, normalizeLocationField, searchLocations } from "./locations.js";

describe("locations catalog", () => {
  it("finds known UN/LOCODE entries", () => {
    expect(findLocationByCode("ESVGO")?.name).toBe("Vigo");
  });

  it("normalizes valid location fields to canonical codes", () => {
    const result = normalizeLocationField("nlrtm", "portOfLoading");
    expect(result.ok).toBe(true);
    expect(result.code).toBe("NLRTM");
  });

  it("rejects unknown location codes", () => {
    const result = normalizeLocationField("NOT-A-CODE", "placeOfReceipt");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("UN/LOCODE");
  });

  it("allows empty location fields", () => {
    expect(normalizeLocationField("", "portOfLoading")).toEqual({ ok: true, code: "" });
  });

  it("searches by query", () => {
    const results = searchLocations("shanghai", 5);
    expect(results[0]?.code).toBe("CNSHA");
  });
});
