import { describe, expect, it } from "@jest/globals";
import {
  displayOrderNumber,
  getOrderBookableLines,
  normalizeOrderNumber,
  resolveOrderNumber,
  validateBookingLinesAgainstOrders,
} from "./orderLineAvailability.js";

describe("order number helpers", () => {
  it("resolveOrderNumber prefers orderNumber and falls back to poNumber", () => {
    expect(resolveOrderNumber({ orderNumber: "ord-1" })).toBe("ORD-1");
    expect(resolveOrderNumber({ poNumber: "PO-DEMO-004" })).toBe("PO-DEMO-004");
    expect(displayOrderNumber({ poNumber: "PO-DEMO-004" })).toBe("PO-DEMO-004");
  });

  it("normalizeOrderNumber trims and uppercases", () => {
    expect(normalizeOrderNumber("  po-1 ")).toBe("PO-1");
  });
});

describe("getOrderBookableLines", () => {
  it("returns error when order number is empty", async () => {
    const result = await getOrderBookableLines("507f1f77bcf86cd799439011", "");
    expect(result.order).toBeNull();
    expect(result.errors).toContain("orderNumber is required");
  });
});

describe("validateBookingLinesAgainstOrders", () => {
  it("skips lines without order number", async () => {
    const errors = await validateBookingLinesAgainstOrders("507f1f77bcf86cd799439011", [
      { lineKey: "L1", sku: "S", bookedQuantity: 1, quantityUnit: "pcs" },
    ]);
    expect(errors).toEqual([]);
  });
});
