import { describe, expect, it } from "@jest/globals";
import { validateCaseInput } from "./caseValidation.js";

describe("validateCaseInput", () => {
  it("requires reference on create", () => {
    const { errors } = validateCaseInput({});
    expect(errors).toContain("reference is required");
  });

  it("accepts a valid case payload", () => {
    const { errors, data } = validateCaseInput({
      reference: "EXP-2026-001",
      title: "Acme export",
      status: "open",
      tradeDirection: "export",
      incoterm: "FOB",
      shipmentIds: ["507f1f77bcf86cd799439011"],
    });
    expect(errors).toEqual([]);
    expect(data.reference).toBe("EXP-2026-001");
    expect(data.tradeDirection).toBe("export");
  });

  it("rejects invalid status", () => {
    const { errors } = validateCaseInput({ reference: "X", status: "unknown" });
    expect(errors.some((e) => e.includes("status must be one of"))).toBe(true);
  });
});
