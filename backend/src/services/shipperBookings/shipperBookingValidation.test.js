import { describe, expect, it } from "@jest/globals";
import { validateShipperBookingInput, validateShipperBookingLineInput } from "./shipperBookingValidation.js";

describe("validateShipperBookingLineInput", () => {
  it("requires mandatory line fields", () => {
    const { errors } = validateShipperBookingLineInput({});
    expect(errors.some((e) => e.includes("lineKey"))).toBe(true);
    expect(errors.some((e) => e.includes("sku"))).toBe(true);
    expect(errors.some((e) => e.includes("bookedQuantity"))).toBe(true);
    expect(errors.some((e) => e.includes("quantityUnit"))).toBe(true);
  });

  it("accepts a valid line", () => {
    const { errors, data } = validateShipperBookingLineInput({
      lineKey: "LINE-1",
      sku: "SKU-100",
      bookedQuantity: 10,
      quantityUnit: "pcs",
    });
    expect(errors).toEqual([]);
    expect(data.bookedQuantity).toBe(10);
  });
});

describe("validateShipperBookingInput", () => {
  it("requires header and at least one line on create", () => {
    const { errors } = validateShipperBookingInput({});
    expect(errors).toContain("bookingReference is required");
    expect(errors).toContain("customer is required");
    expect(errors).toContain("shipper is required");
    expect(errors).toContain("consignee is required");
  });

  it("accepts a valid booking payload", () => {
    const { errors, data } = validateShipperBookingInput({
      bookingReference: "SB202600001",
      customer: "Acme",
      shipper: "Valencia WH",
      consignee: "Rotterdam DC",
      transportMode: "ocean",
      incoterm: "FOB",
      lines: [{ lineKey: "L1", sku: "SKU-1", bookedQuantity: 5, quantityUnit: "ctn" }],
    });
    expect(errors).toEqual([]);
    expect(data.bookingReference).toBe("SB202600001");
    expect(data.transportMode).toBe("ocean");
    expect(data.lines).toHaveLength(1);
  });
});
