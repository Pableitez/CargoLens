import { isValidContractualTier } from "../../../../shared/domain/tradeMasters.js";

describe("contractual domain", () => {
  it("accepts primary and subsidiary tiers", () => {
    expect(isValidContractualTier("primary")).toBe(true);
    expect(isValidContractualTier("subsidiary")).toBe(true);
    expect(isValidContractualTier("shipper")).toBe(false);
  });
});

describe("validateClientInput", () => {
  it("requires parent for subsidiary", async () => {
    const { validateClientInput } = await import("./clientValidation.js");
    const { errors } = await validateClientInput(
      { name: "Plant A", contractualTier: "subsidiary" },
      "507f1f77bcf86cd799439011"
    );
    expect(errors.some((e) => e.includes("parentPartyId"))).toBe(true);
  });
});
