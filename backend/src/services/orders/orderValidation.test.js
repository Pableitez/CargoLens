import { describe, expect, it } from "@jest/globals";
import { validateOrderInput, validateOrderLineInput } from "./orderValidation.js";

describe("validateOrderLineInput", () => {
  it("requires mandatory line fields", () => {
    const { errors } = validateOrderLineInput({});
    expect(errors.some((e) => e.includes("lineKey"))).toBe(true);
    expect(errors.some((e) => e.includes("sku"))).toBe(true);
    expect(errors.some((e) => e.includes("quantity"))).toBe(true);
    expect(errors.some((e) => e.includes("uom"))).toBe(true);
  });

  it("accepts a valid line", () => {
    const { errors, data } = validateOrderLineInput({
      lineKey: "LINE-1",
      sku: "SKU-100",
      quantity: 10,
      uom: "pcs",
    });
    expect(errors).toEqual([]);
    expect(data.quantity).toBe(10);
  });
});

describe("validateOrderInput", () => {
  it("requires header and at least one line on create", () => {
    const { errors } = validateOrderInput({});
    expect(errors).toContain("orderNumber is required");
    expect(errors).toContain("customer is required");
    expect(errors).toContain("shipper is required");
    expect(errors).toContain("consignee is required");
  });

  it("accepts a valid order payload", () => {
    const { errors, data } = validateOrderInput({
      orderNumber: "ORD-001",
      customer: "Acme",
      shipper: "Valencia WH",
      consignee: "Rotterdam DC",
      transportMode: "ocean",
      incoterm: "FOB",
      lines: [{ lineKey: "L1", sku: "SKU-1", quantity: 5, uom: "ctn" }],
    });
    expect(errors).toEqual([]);
    expect(data.orderNumber).toBe("ORD-001");
    expect(data.transportMode).toBe("ocean");
    expect(data.incoterm).toBe("FOB");
    expect(data.lines).toHaveLength(1);
  });

  it("rejects manually setting booking-derived statuses", () => {
    const { errors } = validateOrderInput({
      orderNumber: "ORD-003",
      customer: "Acme",
      shipper: "A",
      consignee: "B",
      status: "booked",
      lines: [{ lineKey: "L1", sku: "S", quantity: 1, uom: "pcs" }],
    });
    expect(errors.some((e) => e.includes("derived from shipper bookings"))).toBe(true);
  });

  it("rejects invalid incoterm", () => {
    const { errors } = validateOrderInput({
      orderNumber: "ORD-002",
      customer: "Acme",
      shipper: "A",
      consignee: "B",
      incoterm: "XXX",
      lines: [{ lineKey: "L1", sku: "S", quantity: 1, uom: "pcs" }],
    });
    expect(errors.some((e) => e.includes("incoterm must be one of"))).toBe(true);
  });

  it("normalizes known location codes and rejects unknown ones", () => {
    const valid = validateOrderInput({
      orderNumber: "ORD-010",
      customer: "Acme",
      shipper: "A",
      consignee: "B",
      portOfLoading: "ESVLC",
      lines: [{ lineKey: "L1", sku: "S", quantity: 1, uom: "pcs" }],
    });
    expect(valid.errors).toEqual([]);
    expect(valid.data.portOfLoading).toBe("ESVLC");

    const invalid = validateOrderInput({
      orderNumber: "ORD-011",
      customer: "Acme",
      shipper: "A",
      consignee: "B",
      placeOfReceipt: "Random City",
      lines: [{ lineKey: "L1", sku: "S", quantity: 1, uom: "pcs" }],
    });
    expect(invalid.errors.some((e) => e.includes("UN/LOCODE"))).toBe(true);
  });
});
