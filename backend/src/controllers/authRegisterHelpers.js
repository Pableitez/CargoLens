import { Party } from "../models/Party.js";
import { Company } from "../models/Company.js";
import { generateInviteCode } from "../utils/inviteCode.js";
import { getEnv } from "../config/env.js";

/**
 * Resuelve empresa + clientId (contractual party id) para registro.
 * @returns {{ ok: true, company: object, clientId: import("mongoose").Types.ObjectId | null } | { ok: false, status: number, body: object }}
 */
export async function resolveCompanyForRegistration({ clientInviteCode, companyInviteCode, companyName }) {
  if (clientInviteCode) {
    const party = await Party.findOne({
      inviteCode: clientInviteCode,
      accountTier: "contractual",
    });
    if (!party) {
      return {
        ok: false,
        status: 400,
        body: { error: "INVALID_INVITE", message: "Client invite code not found." },
      };
    }
    const company = await Company.findById(party.companyId);
    if (!company) {
      return {
        ok: false,
        status: 400,
        body: { error: "INVALID_INVITE", message: "Client workspace invalid." },
      };
    }
    return { ok: true, company, clientId: party._id };
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

  const { allowOpenRegistration } = getEnv();
  if (!allowOpenRegistration) {
    return {
      ok: false,
      status: 403,
      body: {
        error: "REGISTRATION_CLOSED",
        message: "Registration requires a company or client invite code.",
      },
    };
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
