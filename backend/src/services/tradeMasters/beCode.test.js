import {
  BE_CODE_LENGTH,
  beCodeValidationError,
  isValidBeCode,
  normalizeBeCode,
  suggestBeCode,
  suggestBeNameKey,
} from "../../../../shared/domain/beCode.js";
import { isValidFacilityCode } from "../../../../shared/domain/facilityCode.js";
import {
  ALL_DEMO_FLOW_PARTY_CODES,
  DEMO_CLIENT_BE,
  DEMO_FACILITY_CODES,
} from "../../../scripts/demoBeCodes.js";

describe("beCode", () => {
  it("accepts ESINDITHQ", () => {
    expect(isValidBeCode("ESINDITHQ")).toBe(true);
    expect(normalizeBeCode(" es-indit-hq ")).toBe("ESINDITHQ".slice(0, BE_CODE_LENGTH));
  });

  it("accepts custom 2-char function suffix", () => {
    expect(isValidBeCode("ESINDITXY")).toBe(true);
    expect(beCodeValidationError("ESINDITXY")).toBeNull();
  });

  it("strips legal suffixes when suggesting name key", () => {
    expect(suggestBeNameKey("Inditex S.A.")).toBe("INDIT");
    expect(suggestBeCode({ country: "ES", legalName: "Inditex S.A.", functionCode: "HQ" })).toBe("ESINDITHQ");
  });

  it("suggests acronym for multi-word names", () => {
    expect(suggestBeCode({ country: "US", legalName: "Atlantic Grocery NYC", functionCode: "HQ" })).toBe(
      "USAGNXXHQ"
    );
  });

  it("rejects wrong length", () => {
    expect(isValidBeCode("ESINDIT")).toBe(false);
    expect(beCodeValidationError("ESINDIT")).toMatch(/9 characters/);
  });

  it("rejects invalid function suffix", () => {
    expect(isValidBeCode("ESINDITX")).toBe(false);
  });

  it("suggests from country, name and function", () => {
    expect(suggestBeCode({ country: "ES", legalName: "Inditex", functionCode: "HQ" })).toBe("ESINDITHQ");
    expect(suggestBeCode({ country: "VN", legalName: "Hanoi Factory", functionCode: "WH" })).toBe(
      "VNHANOIWH"
    );
  });
});

describe("demo BE codes", () => {
  it("all demo party codes match BE format", () => {
    for (const code of ALL_DEMO_FLOW_PARTY_CODES) {
      expect(isValidBeCode(code)).toBe(true);
    }
  });

  it("demo facility codes match facility format", () => {
    expect(DEMO_FACILITY_CODES).toHaveLength(3);
    for (const code of DEMO_FACILITY_CODES) {
      expect(isValidFacilityCode(code)).toBe(true);
    }
    expect(DEMO_CLIENT_BE.ACME).toBe("USACMERHQ");
  });
});
