export const SHIPMENT_STATUSES = Object.freeze([
  "draft",
  "booked",
  "in_transit",
  "at_port",
  "delivered",
  "cancelled",
]);

export function isValidShipmentStatus(value) {
  return SHIPMENT_STATUSES.includes(String(value ?? "").trim());
}

export function normalizeContainerNumber(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function validateShipmentInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body?.reference !== undefined) {
    const reference = String(body?.reference ?? "").trim();
    if (!reference) errors.push("reference is required");
    else if (reference.length > 80) errors.push("reference must be at most 80 characters");
    else data.reference = reference;
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

  if (body?.notes !== undefined) {
    data.notes = String(body.notes ?? "")
      .trim()
      .slice(0, 2000);
  }

  if (body?.status !== undefined) {
    const status = String(body.status ?? "").trim();
    if (!isValidShipmentStatus(status)) {
      errors.push(`status must be one of: ${SHIPMENT_STATUSES.join(", ")}`);
    } else {
      data.status = status;
    }
  }

  if (body?.clientId !== undefined && body.clientId !== null && body.clientId !== "") {
    data.clientId = String(body.clientId).trim();
  } else if (body?.clientId === null || body?.clientId === "") {
    data.clientId = null;
  }

  for (const field of ["etd", "eta"]) {
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

  if (body?.containers !== undefined) {
    if (!Array.isArray(body.containers)) {
      errors.push("containers must be an array");
    } else {
      data.containers = body.containers.map((row, index) => {
        const containerNumber = normalizeContainerNumber(row?.containerNumber);
        if (!containerNumber || containerNumber.length < 4) {
          errors.push(`containers[${index}].containerNumber must be at least 4 characters`);
        }
        return {
          containerNumber,
          notes: String(row?.notes ?? "")
            .trim()
            .slice(0, 500),
        };
      });
    }
  }

  return { errors, data };
}
