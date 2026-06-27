import {
  FACILITY_CODE_LENGTH,
  FACILITY_PORT_FUNCTION,
  facilityCodeFromCatalogLocation,
  facilityCodeValidationError,
  isValidFacilityCode,
  normalizeFacilityCode,
  suggestFacilityCode,
} from "../../../../shared/domain/facilityCode.js";

describe("facilityCode", () => {
  it("accepts Valencia port ESVCITRM", () => {
    expect(
      facilityCodeFromCatalogLocation({
        code: "ESVLC",
        facilityLocationKey: "VCI",
      })
    ).toBe("ESVCITRM");
    expect(isValidFacilityCode("ESVCITRM")).toBe(true);
  });

  it("builds port codes with TRM from UN/LOCODE", () => {
    expect(facilityCodeFromCatalogLocation({ code: "NLRTM" })).toBe("NLRTMTRM");
    expect(facilityCodeFromCatalogLocation({ code: "ESBCN" })).toBe("ESBCNTRM");
  });

  it("accepts manual terminal code", () => {
    expect(facilityCodeValidationError("ESBCNTRM")).toBeNull();
    expect(isValidFacilityCode("ESBCNTRM")).toBe(true);
  });

  it("accepts manual warehouse code", () => {
    expect(facilityCodeValidationError("ESVALWHS")).toBeNull();
    expect(suggestFacilityCode({ country: "ES", locationKey: "VAL", functionCode: "WHS" })).toBe("ESVALWHS");
  });

  it("accepts custom 3-char function suffix", () => {
    expect(facilityCodeValidationError("ESVALXY1")).toBeNull();
    expect(isValidFacilityCode("ESVALXY1")).toBe(true);
  });

  it("suggests location key from facility name", () => {
    expect(suggestFacilityCode({ country: "ES", name: "Valencia Warehouse", functionCode: "WHS" })).toBe(
      "ESVWXWHS"
    );
    expect(suggestFacilityCode({ country: "ES", name: "Valencia", functionCode: "WHS" })).toBe("ESVALWHS");
  });

  it("rejects wrong length", () => {
    expect(isValidFacilityCode("ESVLC")).toBe(false);
    expect(normalizeFacilityCode(" es-vci-trm ").slice(0, FACILITY_CODE_LENGTH)).toBe("ESVCITRM");
  });
});
