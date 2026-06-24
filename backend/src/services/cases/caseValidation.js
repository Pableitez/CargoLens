export const CASE_STATUSES = Object.freeze([
  "draft",
  "open",
  "in_progress",
  "on_hold",
  "closed",
  "cancelled",
]);

export const CASE_TRADE_DIRECTIONS = Object.freeze(["", "export", "import", "cross_trade"]);

export function isValidCaseStatus(value) {
  return CASE_STATUSES.includes(String(value ?? "").trim());
}

export function isValidTradeDirection(value) {
  const v = String(value ?? "").trim();
  return CASE_TRADE_DIRECTIONS.includes(v);
}

export function validateCaseInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body?.reference !== undefined) {
    const reference = String(body?.reference ?? "").trim();
    if (!reference) errors.push("reference is required");
    else if (reference.length > 80) errors.push("reference must be at most 80 characters");
    else data.reference = reference;
  }

  if (body?.title !== undefined) {
    data.title = String(body.title ?? "")
      .trim()
      .slice(0, 120);
  }

  if (body?.origin !== undefined) {
    data.origin = String(body.origin ?? "")
      .trim()
      .slice(0, 120);
  }

  if (body?.destination !== undefined) {
    data.destination = String(body.destination ?? "")
      .trim()
      .slice(0, 120);
  }

  if (body?.incoterm !== undefined) {
    data.incoterm = String(body.incoterm ?? "")
      .trim()
      .slice(0, 12)
      .toUpperCase();
  }

  if (body?.notes !== undefined) {
    data.notes = String(body.notes ?? "")
      .trim()
      .slice(0, 2000);
  }

  if (body?.status !== undefined) {
    const status = String(body.status ?? "").trim();
    if (!isValidCaseStatus(status)) {
      errors.push(`status must be one of: ${CASE_STATUSES.join(", ")}`);
    } else {
      data.status = status;
    }
  }

  if (body?.tradeDirection !== undefined) {
    const tradeDirection = String(body.tradeDirection ?? "").trim();
    if (!isValidTradeDirection(tradeDirection)) {
      errors.push(`tradeDirection must be one of: ${CASE_TRADE_DIRECTIONS.filter(Boolean).join(", ")}`);
    } else {
      data.tradeDirection = tradeDirection;
    }
  }

  if (body?.clientId !== undefined && body.clientId !== null && body.clientId !== "") {
    data.clientId = String(body.clientId).trim();
  } else if (body?.clientId === null || body?.clientId === "") {
    data.clientId = null;
  }

  for (const field of ["openedAt", "closedAt"]) {
    if (body?.[field] === undefined) continue;
    if (body[field] === null || body[field] === "") {
      data[field] = null;
      continue;
    }
    const d = new Date(body[field]);
    if (Number.isNaN(d.getTime())) {
      errors.push(`${field} must be a valid date`);
    } else {
      data[field] = d;
    }
  }

  if (body?.shipmentIds !== undefined) {
    if (!Array.isArray(body.shipmentIds)) {
      errors.push("shipmentIds must be an array");
    } else {
      data.shipmentIds = body.shipmentIds.map((id, index) => {
        const value = String(id ?? "").trim();
        if (!value) errors.push(`shipmentIds[${index}] is invalid`);
        return value;
      });
    }
  }

  return { errors, data };
}
