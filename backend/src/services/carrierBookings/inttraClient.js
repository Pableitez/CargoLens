const INTTRA_API_BASE = process.env.INTTRA_API_BASE ?? "https://api.inttra.com";

/**
 * Submit a booking request to INTTRA.
 * Live HTTP integration is stubbed until UAT credentials and API contract are available.
 *
 * @param {string} apiKey
 * @param {Record<string, unknown>} payload
 * @param {{ baseUrl?: string }} [options]
 */
export async function submitInttraBooking(apiKey, payload, options = {}) {
  if (!String(apiKey ?? "").trim()) {
    const err = new Error("INTTRA API key is not configured.");
    err.code = "INTTRA_NOT_CONFIGURED";
    throw err;
  }

  const baseUrl = String(options.baseUrl ?? INTTRA_API_BASE).replace(/\/$/, "");
  void baseUrl;
  void payload;

  const err = new Error(
    "INTTRA live submission is not implemented yet. Use CARRIER_BOOKING_MODE=mock or complete inttraClient integration."
  );
  err.code = "INTTRA_NOT_IMPLEMENTED";
  throw err;
}

export { INTTRA_API_BASE };
