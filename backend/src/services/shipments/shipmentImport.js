import mongoose from "mongoose";
import { Client } from "../../models/Client.js";
import { Shipment } from "../../models/Shipment.js";
import { pickCell } from "../../utils/spreadsheet.js";
import { logShipmentEvent } from "./shipmentEvents.js";
import { normalizeContainerNumber, validateShipmentInput } from "./shipmentValidation.js";

function parseDateCell(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseContainersFromRow(row) {
  const single = pickCell(row, "container", "container_number", "contenedor", "container number");
  const listRaw = pickCell(row, "containers", "contenedores");
  const numbers = [];
  if (single) numbers.push(normalizeContainerNumber(single));
  if (listRaw) {
    for (const part of listRaw.split(/[,;|]/)) {
      const n = normalizeContainerNumber(part);
      if (n.length >= 4) numbers.push(n);
    }
  }
  return [...new Set(numbers)].map((containerNumber) => ({ containerNumber, notes: "" }));
}

export function parseShipmentImportRow(row, rowIndex) {
  const reference = pickCell(row, "reference", "referencia", "ref", "job", "embarque");
  const origin = pickCell(row, "origin", "origen", "from");
  const destination = pickCell(row, "destination", "destino", "to");
  const statusRaw = pickCell(row, "status", "estado").toLowerCase().replace(/\s+/g, "_");
  const notes = pickCell(row, "notes", "notas", "note");
  const etd = parseDateCell(pickCell(row, "etd", "salida", "departure"));
  const eta = parseDateCell(pickCell(row, "eta", "llegada", "arrival"));
  const clientInvite = pickCell(
    row,
    "client_invite",
    "client invite",
    "invite",
    "client_code",
    "codigo_cliente"
  );
  const containers = parseContainersFromRow(row);

  const payload = {
    reference,
    origin,
    destination,
    notes,
    etd,
    eta,
    status: statusRaw || "draft",
    containers,
    clientInvite,
  };

  const { errors, data } = validateShipmentInput(payload);
  const rowErrors = [...errors];
  if (!reference) rowErrors.unshift(`Row ${rowIndex + 2}: reference is required`);

  return {
    rowNumber: rowIndex + 2,
    reference: reference || `(row ${rowIndex + 2})`,
    payload: data,
    clientInvite,
    errors: rowErrors,
    valid: rowErrors.length === 0,
  };
}

export async function buildClientInviteMap(companyId) {
  const clients = await Client.find({ companyId: new mongoose.Types.ObjectId(companyId) }).lean();
  return new Map(clients.map((c) => [c.inviteCode.toUpperCase(), c]));
}

export function previewShipmentImportRows(rows) {
  const preview = rows.map((row, i) => parseShipmentImportRow(row, i));
  const valid = preview.filter((p) => p.valid).length;
  return {
    rowsTotal: rows.length,
    valid,
    invalid: rows.length - valid,
    preview: preview.slice(0, 50).map((p) => ({
      rowNumber: p.rowNumber,
      reference: p.reference,
      errors: p.errors,
      valid: p.valid,
    })),
    errors: preview
      .filter((p) => !p.valid)
      .flatMap((p) => p.errors)
      .slice(0, 25),
  };
}

export async function importShipmentRows(rows, companyId, inviteToClient, actor) {
  let created = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += 1) {
    const parsed = parseShipmentImportRow(rows[i], i);
    if (!parsed.valid) {
      skipped += 1;
      errors.push(...parsed.errors);
      continue;
    }

    let clientId = null;
    if (parsed.clientInvite) {
      const code = parsed.clientInvite.toUpperCase().replace(/\s+/g, "");
      const client = inviteToClient.get(code);
      if (!client) {
        skipped += 1;
        errors.push(`Row ${parsed.rowNumber}: unknown client invite "${parsed.clientInvite}"`);
        continue;
      }
      clientId = client._id;
    }

    try {
      const doc = await Shipment.create({
        companyId,
        reference: parsed.payload.reference,
        origin: parsed.payload.origin ?? "",
        destination: parsed.payload.destination ?? "",
        etd: parsed.payload.etd ?? null,
        eta: parsed.payload.eta ?? null,
        status: parsed.payload.status ?? "draft",
        notes: parsed.payload.notes ?? "",
        clientId,
        containers: parsed.payload.containers ?? [],
      });
      await logShipmentEvent({
        shipmentId: doc._id,
        companyId,
        kind: "import",
        message: `Imported from spreadsheet (${doc.reference})`,
        actorUserId: actor?.userId ?? null,
        actorEmail: actor?.email ?? "",
      });
      created += 1;
    } catch (err) {
      if (err?.code === 11000) {
        skipped += 1;
        errors.push(`Row ${parsed.rowNumber}: duplicate reference ${parsed.payload.reference}`);
      } else {
        skipped += 1;
        errors.push(`Row ${parsed.rowNumber}: could not save`);
      }
    }
  }

  return { created, skipped, errors: errors.slice(0, 25), actor };
}
