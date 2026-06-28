import { buildMockInttraResponse } from "./buildMockInttraResponse.js";
import { mapInttraResponseToApp } from "./mapInttraResponseToApp.js";
import { mapCarrierRequestToInttraPayload } from "./mapShipperBookingToInttraPayload.js";
import { submitInttraBooking } from "./inttraClient.js";

/**
 * @param {import("mongoose").Document | Record<string, unknown>} carrierRequest
 * @param {{ carrierBookingMode?: string, inttraApiKey?: string, inttraApiBase?: string }} env
 */
export async function submitCarrierBookingRequest(carrierRequest, env = {}) {
  const payload = mapCarrierRequestToInttraPayload(carrierRequest);
  const mode = String(env.carrierBookingMode ?? "mock")
    .trim()
    .toLowerCase();
  const inttraApiKey = String(env.inttraApiKey ?? "").trim();

  if (mode === "inttra" && inttraApiKey) {
    const raw = await submitInttraBooking(inttraApiKey, payload, { baseUrl: env.inttraApiBase });
    return {
      source: "inttra",
      payload,
      raw,
      mapped: mapInttraResponseToApp(raw),
    };
  }

  const raw = buildMockInttraResponse(payload, {
    requestReference: carrierRequest.requestReference,
  });

  return {
    source: "mock",
    payload,
    raw,
    mapped: mapInttraResponseToApp(raw),
  };
}
