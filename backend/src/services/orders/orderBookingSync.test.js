import { describe, expect, it } from "@jest/globals";
import { computeOrderStatusFromBookings } from "./orderBookingSync.js";

describe("computeOrderStatusFromBookings", () => {
  const baseOrder = {
    status: "new",
    lines: [
      { lineKey: "L1", quantity: 100 },
      { lineKey: "L2", quantity: 50 },
    ],
  };

  it("keeps new when no booking lines match", () => {
    const status = computeOrderStatusFromBookings(baseOrder, new Map());
    expect(status).toBe("new");
  });

  it("returns partially_booked when only some quantity is booked", () => {
    const status = computeOrderStatusFromBookings(baseOrder, new Map([["L1", 40]]));
    expect(status).toBe("partially_booked");
  });

  it("returns booked when all lines are fully covered", () => {
    const status = computeOrderStatusFromBookings(
      baseOrder,
      new Map([
        ["L1", 100],
        ["L2", 50],
      ])
    );
    expect(status).toBe("booked");
  });

  it("does not change cancelled orders", () => {
    const status = computeOrderStatusFromBookings(
      { ...baseOrder, status: "cancelled" },
      new Map([["L1", 100]])
    );
    expect(status).toBe("cancelled");
  });
});
