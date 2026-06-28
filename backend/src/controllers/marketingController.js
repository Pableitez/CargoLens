import { isDbConnected } from "../db.js";
import { PilotLead } from "../models/PilotLead.js";
import { notifyPilotLead } from "../services/marketing/pilotLeadNotify.js";
import { devError } from "../utils/devLog.js";
import { jsonError } from "../utils/jsonError.js";

export async function createPilotLead(req, res) {
  if (!isDbConnected()) {
    return jsonError(res, 503, "DB_UNAVAILABLE", "Database not configured or unreachable.");
  }

  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const companyName = String(req.body?.companyName ?? req.body?.company ?? "").trim();
  const contactName = String(req.body?.name ?? req.body?.contactName ?? "").trim();
  const locale = String(req.body?.locale ?? "en").slice(0, 8);
  const source = String(req.body?.source ?? "landing").slice(0, 40);

  if (!email || !email.includes("@")) {
    return jsonError(res, 400, "INVALID_INPUT", "Valid email required.");
  }
  if (!companyName || companyName.length < 2) {
    return jsonError(res, 400, "INVALID_INPUT", "Company name required.");
  }

  try {
    const existing = await PilotLead.findOne({ email });
    if (existing) {
      existing.companyName = companyName;
      if (contactName) existing.contactName = contactName;
      existing.locale = locale;
      await existing.save();
      void notifyPilotLead({ email, companyName, contactName, locale, updated: true });
      return res.status(200).json({ ok: true, updated: true });
    }

    await PilotLead.create({ email, companyName, contactName, locale, source });
    void notifyPilotLead({ email, companyName, contactName, locale, updated: false });
    return res.status(201).json({ ok: true });
  } catch (err) {
    devError(err);
    return jsonError(res, 500, "SERVER_ERROR", "Could not save pilot request.");
  }
}
