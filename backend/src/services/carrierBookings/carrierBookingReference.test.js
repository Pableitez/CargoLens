import { describe, expect, it } from "@jest/globals";
import {
  CARRIER_BOOKING_REF_PREFIX,
  formatCarrierBookingReference,
  parseCarrierBookingReferenceSequence,
} from "./carrierBookingReference.js";

describe("carrierBookingReference", () => {
  it("parses sequential references for the current year", () => {
    expect(parseCarrierBookingReferenceSequence(`${CARRIER_BOOKING_REF_PREFIX}202600012`, 2026)).toBe(12);
    expect(parseCarrierBookingReferenceSequence(`${CARRIER_BOOKING_REF_PREFIX}-2026-00012`, 2026)).toBe(12);
    expect(parseCarrierBookingReferenceSequence(`${CARRIER_BOOKING_REF_PREFIX}202500099`, 2026)).toBe(0);
  });

  it("formats zero-padded consecutive references", () => {
    expect(formatCarrierBookingReference(2026, 1)).toBe(`${CARRIER_BOOKING_REF_PREFIX}202600001`);
    expect(formatCarrierBookingReference(2026, 123)).toBe(`${CARRIER_BOOKING_REF_PREFIX}202600123`);
  });
});
