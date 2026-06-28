import crypto from "node:crypto";

/**
 * Deterministic mock INTTRA acknowledgment for local/dev testing without credentials.
 */
export function buildMockInttraResponse(payload, { requestReference }) {
  const suffix = crypto
    .createHash("sha256")
    .update(String(requestReference))
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();

  return {
    source: "mock",
    status: "ACKNOWLEDGED",
    transactionId: `MOCK-INTTRA-${suffix}`,
    carrierBookingReference: `BK${suffix}`,
    message:
      "Mock INTTRA acknowledgment — configure INTTRA_API_KEY and CARRIER_BOOKING_MODE=inttra for live UAT.",
    receivedAt: new Date().toISOString(),
    payloadEcho: payload,
  };
}
