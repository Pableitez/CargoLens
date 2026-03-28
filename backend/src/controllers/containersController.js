import mongoose from "mongoose";
import XLSX from "xlsx";
import { isDbConnected } from "../db.js";
import { Client } from "../models/Client.js";
import { SavedContainer } from "../models/SavedContainer.js";
import { logWorkspaceActivity } from "../services/workspaceActivityLog.js";
import { devError } from "../utils/devLog.js";

function normalizeContainer(raw) {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function dbUnavailable(res) {
  return res.status(503).json({
    error: "DB_UNAVAILABLE",
    message: "Database not configured or unreachable.",
  });
}

function normalizeEntrySource(raw) {
  if (raw === "import") return "import";
  if (raw === "seed") return "seed";
  if (raw === "api") return "api";
  return "manual";
}

function serializeRow(r) {
  return {
    id: r._id,
    containerNumber: r.containerNumber,
    clientId: r.clientId ?? null,
    clientName: r.clientName || "",
    notes: r.notes || "",
    entrySource: normalizeEntrySource(r.entrySource),
    lifecycleStatus: r.lifecycleStatus === "completed" ? "completed" : "active",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function listContainers(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const companyId = req.user.companyId;
  const clientFilter = String(req.query.client ?? "").trim();
  const clientIdFilter = String(req.query.clientId ?? "").trim();

  const q = { companyId: new mongoose.Types.ObjectId(companyId) };

  if (req.user.clientId) {
    q.clientId = new mongoose.Types.ObjectId(req.user.clientId);
  } else {
    if (mongoose.isValidObjectId(clientIdFilter)) {
      q.clientId = new mongoose.Types.ObjectId(clientIdFilter);
    } else if (clientFilter) {
      const cf = clientFilter.slice(0, MAX_CLIENT_FILTER_LEN);
      q.clientName = new RegExp(escapeForRegex(cf), "i");
    }
  }

  try {
    const rows = await SavedContainer.find(q).sort({ updatedAt: -1 }).lean();
    return res.json({
      items: rows.map(serializeRow),
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list containers." });
  }
}

export async function createContainer(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  if (req.user.clientId) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Client portal accounts cannot add containers. Ask your forwarder.",
    });
  }

  const companyId = req.user.companyId;
  const containerNumber = normalizeContainer(req.body?.containerNumber);
  const notes = String(req.body?.notes ?? "").trim();
  let clientId = null;
  let clientName = String(req.body?.clientName ?? "").trim();

  const rawClientId = req.body?.clientId;
  if (rawClientId && mongoose.isValidObjectId(rawClientId)) {
    const client = await Client.findOne({
      _id: rawClientId,
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean();
    if (!client) {
      return res.status(400).json({ error: "INVALID_CLIENT", message: "Unknown client for this company." });
    }
    clientId = client._id;
    clientName = client.name;
  }

  if (containerNumber.length < 4) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "Container number must be at least 4 characters.",
    });
  }

  try {
    const doc = await SavedContainer.create({
      companyId,
      clientId,
      containerNumber,
      clientName,
      notes,
      entrySource: "manual",
    });
    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "container.create",
      summary: `Saved container ${containerNumber}${clientName ? ` · ${clientName}` : ""}`,
      meta: { containerNumber, clientName: clientName || null },
    });
    return res.status(201).json({
      item: serializeRow(doc.toObject()),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "DUPLICATE",
        message: "This container is already saved for your company.",
      });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not save container." });
  }
}

export async function updateContainer(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  if (req.user.clientId) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Client portal accounts cannot edit saved containers.",
    });
  }

  const companyId = req.user.companyId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid container id." });
  }

  const hasNotes = Object.prototype.hasOwnProperty.call(req.body ?? {}, "notes");
  const hasClientId = Object.prototype.hasOwnProperty.call(req.body ?? {}, "clientId");
  const hasLifecycleStatus = Object.prototype.hasOwnProperty.call(req.body ?? {}, "lifecycleStatus");

  if (!hasNotes && !hasClientId && !hasLifecycleStatus) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "Send notes, clientId, and/or lifecycleStatus to update.",
    });
  }

  try {
    const doc = await SavedContainer.findOne({
      _id: id,
      companyId: new mongoose.Types.ObjectId(companyId),
    });
    if (!doc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Container not found." });
    }

    if (hasNotes) {
      doc.notes = String(req.body?.notes ?? "").trim();
    }

    if (hasClientId) {
      const raw = req.body?.clientId;
      if (raw === null || raw === "") {
        doc.clientId = null;
        doc.clientName = "";
      } else if (mongoose.isValidObjectId(raw)) {
        const client = await Client.findOne({
          _id: raw,
          companyId: new mongoose.Types.ObjectId(companyId),
        }).lean();
        if (!client) {
          return res.status(400).json({ error: "INVALID_CLIENT", message: "Unknown client for this company." });
        }
        doc.clientId = client._id;
        doc.clientName = client.name;
      } else {
        return res.status(400).json({ error: "INVALID_CLIENT", message: "Invalid client id." });
      }
    }

    if (hasLifecycleStatus) {
      const ls = String(req.body?.lifecycleStatus ?? "").trim();
      if (ls !== "active" && ls !== "completed") {
        return res.status(400).json({
          error: "INVALID_INPUT",
          message: "lifecycleStatus must be active or completed.",
        });
      }
      doc.lifecycleStatus = ls;
    }

    await doc.save();

    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "container.update",
      summary: `Updated saved container ${doc.containerNumber}`,
      meta: { containerNumber: doc.containerNumber },
    });

    const fresh = await SavedContainer.findById(doc._id).lean();
    return res.json({ item: serializeRow(fresh) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update container." });
  }
}

export async function deleteContainer(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  if (req.user.clientId) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Client portal accounts cannot remove containers.",
    });
  }

  const companyId = req.user.companyId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid container id." });
  }

  try {
    const existing = await SavedContainer.findOne({
      _id: id,
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean();
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Container not found." });
    }
    await SavedContainer.deleteOne({ _id: id });
    void logWorkspaceActivity({
      companyId,
      userId: req.user.userId,
      actorEmail: req.user.email,
      action: "container.delete",
      summary: `Removed container ${existing.containerNumber}`,
      meta: { containerNumber: existing.containerNumber },
    });
    return res.status(204).send();
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete container." });
  }
}

function normalizeHeaderKey(k) {
  return String(k ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function pickCell(row, ...keys) {
  const map = {};
  for (const [k, v] of Object.entries(row)) {
    map[normalizeHeaderKey(k)] = v;
  }
  for (const key of keys) {
    const nk = normalizeHeaderKey(key);
    if (map[nk] !== undefined && map[nk] !== null && String(map[nk]).trim() !== "") {
      return String(map[nk]).trim();
    }
  }
  return "";
}

export async function importContainers(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  if (!req.file?.buffer) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "Upload an Excel file (.xlsx or .xls).",
    });
  }

  const companyId = req.user.companyId;
  let workbook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  } catch {
    return res.status(400).json({ error: "INVALID_FILE", message: "Could not read Excel file." });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!rows.length) {
    return res.status(400).json({ error: "EMPTY", message: "The sheet has no data rows." });
  }

  const clients = await Client.find({ companyId: new mongoose.Types.ObjectId(companyId) }).lean();
  const inviteToClient = new Map(clients.map((c) => [c.inviteCode.toUpperCase(), c]));

  let created = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const containerNumber = normalizeContainer(
      pickCell(row, "container", "container_number", "container number", "contenedor", "number", "ctn")
    );
    if (!containerNumber || containerNumber.length < 4) {
      skipped += 1;
      if (containerNumber) errors.push(`Row ${i + 2}: invalid container number`);
      continue;
    }

    const inviteRaw = pickCell(
      row,
      "client_invite",
      "client invite",
      "invite",
      "client_code",
      "client code",
      "codigo_cliente"
    );
    const notes = pickCell(row, "notes", "note", "notas", "remarks");

    let clientId = null;
    let clientName = "";
    if (inviteRaw) {
      const code = inviteRaw.toUpperCase().replace(/\s+/g, "");
      const client = inviteToClient.get(code);
      if (!client) {
        errors.push(`Row ${i + 2}: unknown client invite "${inviteRaw}"`);
        skipped += 1;
        continue;
      }
      clientId = client._id;
      clientName = client.name;
    }

    try {
      await SavedContainer.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        clientId,
        containerNumber,
        clientName,
        notes,
        entrySource: "import",
      });
      created += 1;
    } catch (err) {
      if (err.code === 11000) {
        skipped += 1;
        errors.push(`Row ${i + 2}: duplicate container ${containerNumber}`);
      } else {
        skipped += 1;
        devError("import row", i + 2, err);
        errors.push(`Row ${i + 2}: could not save`);
      }
    }
  }

  void logWorkspaceActivity({
    companyId,
    userId: req.user.userId,
    actorEmail: req.user.email,
    action: "container.import",
    summary: `Excel import · ${created} added, ${skipped} skipped (${sheetName})`,
    meta: { created, skipped, sheet: sheetName, rowsTotal: rows.length },
  });

  return res.json({
    ok: true,
    sheet: sheetName,
    rowsTotal: rows.length,
    created,
    skipped,
    errors: errors.slice(0, 25),
  });
}
