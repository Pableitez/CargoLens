const SAFECUBE_TRACKING_BASE =
  process.env.SAFECUBE_TRACKING_BASE ??
  "https://api.sinay.ai/container-tracking/api/v2";

const SOFT_ERROR_MESSAGES = {
  SEALINE_HASNT_PROVIDE_INFO:
    "The shipping line returned no data for this number. Try another container, booking, or bill of lading, or omit the sealine if auto-detection is enabled.",
  NO_EVENTS:
    "The carrier reported the container but provided no event timeline yet.",
};

function assertHasShipmentBody(body) {
  const hasData =
    body?.metadata != null ||
    (Array.isArray(body?.containers) && body.containers.length > 0);
  if (hasData) return;

  const code = body?.message;
  const hint =
    (code && SOFT_ERROR_MESSAGES[code]) ||
    (typeof body?.message === "string" && body.message.length < 200
      ? body.message
      : null);
  const detail =
    Array.isArray(body?.details) && body.details[0]
      ? ` ${body.details[0]}`
      : "";
  const err = new Error(
    hint
      ? `${hint}${detail}`
      : `No tracking data for this request.${detail}`
  );
  err.status = 404;
  err.code = code;
  err.body = body;
  throw err;
}

// Sinay Container Tracking v2 (misma API_KEY que credenciales). HTTP 200 con payload de error → fallo.
export async function fetchSafecubeShipment(apiKey, shipmentNumber, options = {}) {
  const params = new URLSearchParams({
    shipmentNumber: String(shipmentNumber).trim().toUpperCase().replace(/\s+/g, ""),
    shipmentType: "CT",
    route: "true",
    ais: "true",
  });
  if (options.sealine) {
    params.set("sealine", String(options.sealine).toUpperCase());
  }

  const url = `${SAFECUBE_TRACKING_BASE}/shipment?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      API_KEY: apiKey,
      Accept: "application/json",
    },
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { parseError: text };
  }

  if (!res.ok) {
    const err = new Error(
      body?.message || body?.error || `Safecube HTTP ${res.status}`
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }

  assertHasShipmentBody(body);
  return body;
}

function isSealineMismatchError(err) {
  return (
    err?.code === "SEALINE_HASNT_PROVIDE_INFO" ||
    String(err?.message ?? "").includes("SEALINE_HASNT_PROVIDE_INFO")
  );
}

// Primer intento con sealine deducida; si Sinay rechaza, reintento sin sealine.
export async function fetchSafecubeShipmentWithSealineFallback(
  apiKey,
  shipmentNumber,
  sealineGuess
) {
  try {
    return await fetchSafecubeShipment(apiKey, shipmentNumber, {
      sealine: sealineGuess,
    });
  } catch (err) {
    if (sealineGuess && isSealineMismatchError(err)) {
      return await fetchSafecubeShipment(apiKey, shipmentNumber, {});
    }
    throw err;
  }
}
