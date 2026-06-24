import { describe, expect, it } from "@jest/globals";
import { validateShipmentInput } from "./shipmentValidation.js";

describe("validateShipmentInput", () => {
  it("requires reference on create", () => {
    const { errors } = validateShipmentInput({});
    expect(errors).toContain("reference is required");
  });

  it("accepts a valid shipment payload", () => {
    const { errors, data } = validateShipmentInput({
      reference: "REF-001",
      origin: "Valencia",
      destination: "Rotterdam",
      status: "in_transit",
      containers: [{ containerNumber: "MSCU1234567" }],
    });
    expect(errors).toEqual([]);
    expect(data.reference).toBe("REF-001");
    expect(data.containers[0].containerNumber).toBe("MSCU1234567");
  });

  it("rejects invalid status", () => {
    const { errors } = validateShipmentInput({ reference: "X", status: "unknown" });
    expect(errors.some((e) => e.includes("status must be one of"))).toBe(true);
  });
});
