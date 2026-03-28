import { Client } from "../models/Client.js";
import { Company } from "../models/Company.js";
import { generateInviteCode } from "../utils/inviteCode.js";

/**
 * Resuelve empresa + clientId para registro (invite cliente, invite empresa o nueva empresa).
 * @returns {{ ok: true, company: object, clientId: import("mongoose").Types.ObjectId | null } | { ok: false, status: number, body: object }}
 */
export async function resolveCompanyForRegistration({
  clientInviteCode,
  companyInviteCode,
  companyName,
}) {
  if (clientInviteCode) {
    const client = await Client.findOne({ inviteCode: clientInviteCode });
    if (!client) {
      return {
        ok: false,
        status: 400,
        body: { error: "INVALID_INVITE", message: "Client invite code not found." },
      };
    }
    const company = await Company.findById(client.companyId);
    if (!company) {
      return {
        ok: false,
        status: 400,
        body: { error: "INVALID_INVITE", message: "Client workspace invalid." },
      };
    }
    return { ok: true, company, clientId: client._id };
  }

  if (companyInviteCode) {
    const company = await Company.findOne({ inviteCode: companyInviteCode });
    if (!company) {
      return {
        ok: false,
        status: 400,
        body: { error: "INVALID_INVITE", message: "Company invite code not found." },
      };
    }
    return { ok: true, company, clientId: null };
  }

  if (!companyName) {
    return {
      ok: false,
      status: 400,
      body: {
        error: "INVALID_INPUT",
        message: "Company name is required when not using an invite code.",
      },
    };
  }

  let code = generateInviteCode();
  for (let i = 0; i < 5; i += 1) {
    const clash = await Company.findOne({ inviteCode: code });
    if (!clash) break;
    code = generateInviteCode();
  }
  const company = await Company.create({ name: companyName, inviteCode: code });
  return { ok: true, company, clientId: null };
}
