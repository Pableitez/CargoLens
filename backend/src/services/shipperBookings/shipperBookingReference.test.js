import { describe, expect, it } from "@jest/globals";
import {
  BOOKING_REF_PREFIX,
  formatBookingReference,
  parseBookingReferenceSequence,
} from "./shipperBookingReference.js";

describe("shipperBookingReference", () => {
  it("parses sequential references for the current year", () => {
    expect(parseBookingReferenceSequence(`${BOOKING_REF_PREFIX}202600012`, 2026)).toBe(12);
    expect(parseBookingReferenceSequence(`${BOOKING_REF_PREFIX}-2026-00012`, 2026)).toBe(12);
    expect(parseBookingReferenceSequence(`${BOOKING_REF_PREFIX}202500099`, 2026)).toBe(0);
    expect(parseBookingReferenceSequence("CUSTOMREF", 2026)).toBe(0);
  });

  it("formats zero-padded consecutive references", () => {
    expect(formatBookingReference(2026, 1)).toBe(`${BOOKING_REF_PREFIX}202600001`);
    expect(formatBookingReference(2026, 123)).toBe(`${BOOKING_REF_PREFIX}202600123`);
  });
});
