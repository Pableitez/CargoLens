import { describe, expect, it } from "vitest";
import { isValidLatLng } from "./coords.js";

describe("isValidLatLng", () => {
  it("returns false for out-of-range latitude", () => {
    expect(isValidLatLng(91, 0)).toBe(false);
    expect(isValidLatLng(-91, 0)).toBe(false);
  });

  it("returns false for out-of-range longitude", () => {
    expect(isValidLatLng(0, 181)).toBe(false);
  });

  it("returns true for valid WGS84 pair", () => {
    expect(isValidLatLng(40.5, -3.7)).toBe(true);
  });
});
