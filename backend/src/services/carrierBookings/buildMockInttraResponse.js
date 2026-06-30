import crypto from "node:crypto";
import {
  buildRoutingLegsFromRouting,
  enrichRoutingLegsWithCarrierSchedule,
} from "./carrierBookingRoutingLegs.js";

const MOCK_OUTCOMES = new Set(["acknowledged", "confirmed", "rejected", "failed"]);

function normalizeMockOutcome(value) {
  const outcome = String(value ?? "acknowledged")
    .trim()
    .toLowerCase();
  return MOCK_OUTCOMES.has(outcome) ? outcome : "acknowledged";
}

/**
 * Deterministic mock INTTRA acknowledgment for local/dev testing without credentials.
 * @param {Record<string, unknown>} payload
 * @param {{ requestReference: string, outcome?: string }} options
 */
export function buildMockInttraResponse(payload, { requestReference, outcome = "acknowledged" }) {
  const suffix = crypto
    .createHash("sha256")
    .update(String(requestReference))
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();

  const normalized = normalizeMockOutcome(outcome);

  if (normalized === "rejected") {
    return {
      source: "mock",
      status: "REJECTED",
      transactionId: `MOCK-INTTRA-${suffix}`,
      carrierBookingReference: "",
      rejectionReason: "Mock carrier rejection — equipment not available on requested sailing.",
      message: "Mock INTTRA rejection for local testing.",
      receivedAt: new Date().toISOString(),
      payloadEcho: payload,
    };
  }

  if (normalized === "failed") {
    return {
      source: "mock",
      status: "FAILED",
      transactionId: `MOCK-INTTRA-${suffix}`,
      carrierBookingReference: "",
      rejectionReason: "Mock provider error — retry or check payload.",
      message: "Mock INTTRA failure for local testing.",
      receivedAt: new Date().toISOString(),
      payloadEcho: payload,
    };
  }

  const status = normalized === "confirmed" ? "CONFIRMED" : "ACKNOWLEDGED";
  const routingLegs = enrichRoutingLegsWithCarrierSchedule(
    buildRoutingLegsFromRouting(payload?.routing ?? {}, {
      transhipmentPorts: payload?.routing?.transhipmentPorts,
    }),
    {
      requestReference,
      requestedDepartureDate: payload?.dates?.requestedDepartureDate ?? null,
    }
  );

  return {
    source: "mock",
    status,
    transactionId: `MOCK-INTTRA-${suffix}`,
    carrierBookingReference: `BK${suffix}`,
    routingLegs,
    message:
      status === "CONFIRMED"
        ? "Mock INTTRA confirmation — configure INTTRA_API_KEY and CARRIER_BOOKING_MODE=inttra for live UAT."
        : "Mock INTTRA acknowledgment — configure INTTRA_API_KEY and CARRIER_BOOKING_MODE=inttra for live UAT.",
    receivedAt: new Date().toISOString(),
    payloadEcho: payload,
  };
}
