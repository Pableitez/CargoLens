import { normalizeLatLng } from "./coords.js";

describe("normalizeLatLng", () => {
  it("returns null when coordinates are not finite", () => {
    expect(normalizeLatLng(NaN, 0)).toBeNull();
    expect(normalizeLatLng(0, Number.NaN)).toBeNull();
  });

  it("returns null when out of WGS84 range", () => {
    expect(normalizeLatLng(91, 0)).toBeNull();
    expect(normalizeLatLng(0, 181)).toBeNull();
  });

  it("returns lat/lng object when valid", () => {
    expect(normalizeLatLng(40.5, -3.7)).toEqual({ lat: 40.5, lng: -3.7 });
  });
});
