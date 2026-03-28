import { describe, expect, it } from "vitest";
import {
  vesselNoCoordsFootnote,
  vesselResultsMapDataSource,
  vesselResultsSourceLabel,
} from "./vesselsPageHelpers.js";

describe("vesselResultsSourceLabel", () => {
  it("returns null sin datos", () => {
    expect(vesselResultsSourceLabel(null)).toBeNull();
  });

  it("resuelve containers live/mock y APIs", () => {
    expect(vesselResultsSourceLabel({ source: "containers", mode: "live" })).toContain("saved containers");
    expect(vesselResultsSourceLabel({ source: "containers", mode: "mock" })).toContain("Demo");
    expect(vesselResultsSourceLabel({ source: "safecube" })).toContain("Sinay");
    expect(vesselResultsSourceLabel({ source: "mock" })).toContain("Demo");
  });
});

describe("vesselResultsMapDataSource", () => {
  it("returns null sin datos", () => {
    expect(vesselResultsMapDataSource(null)).toBeNull();
  });

  it("mapea source al modo del mapa", () => {
    expect(vesselResultsMapDataSource({ source: "containers", mode: "mock" })).toBe("mock");
    expect(vesselResultsMapDataSource({ source: "containers", mode: "live" })).toBe("safecube");
    expect(vesselResultsMapDataSource({ source: "safecube" })).toBe("safecube");
    expect(vesselResultsMapDataSource({ source: "mock" })).toBe("mock");
  });
});

describe("vesselNoCoordsFootnote", () => {
  it("cubre ramas por source y flags Sinay", () => {
    expect(vesselNoCoordsFootnote({ source: "containers" })).toContain("No map position");
    expect(vesselNoCoordsFootnote({ source: "safecube", aishubEnrichment: true })).toContain("AISHub");
    expect(vesselNoCoordsFootnote({ source: "safecube", intelEnrichment: true })).toContain("Vessels Intelligence");
    expect(vesselNoCoordsFootnote({ source: "safecube" })).toContain("SAFECUBE_VESSEL_INTEL_ENRICH");
    expect(vesselNoCoordsFootnote({ source: "other" })).toContain("latitude/longitude");
  });
});
