import mongoose from "mongoose";
import { Party } from "../../models/Party.js";
import { SupplyChain } from "../../models/SupplyChain.js";
import { generateClientInviteCode } from "../../utils/clientInviteCode.js";
import { validateContractualPartyInput } from "./contractualPartyValidation.js";

async function generateUniqueInviteCode() {
  for (let i = 0; i < 8; i += 1) {
    const inviteCode = generateClientInviteCode();
    const clash = await Party.findOne({ inviteCode }).select("_id").lean();
    if (!clash) return inviteCode;
  }
  return generateClientInviteCode();
}

export async function resolvePartyAccountTierPatch(body, existing, companyId) {
  const errors = [];
  const data = {};
  const currentTier = existing.accountTier ?? "operational";
  const requestedTier =
    body?.accountTier !== undefined
      ? String(body.accountTier ?? "")
          .trim()
          .toLowerCase()
      : currentTier;

  if (requestedTier !== "operational" && requestedTier !== "contractual") {
    errors.push("accountTier must be operational or contractual");
    return { errors, data };
  }

  if (requestedTier === "contractual") {
    const { errors: contractualErrors, data: contractualData } = await validateContractualPartyInput(
      body,
      companyId,
      {
        partial: currentTier === "contractual",
        existing: currentTier === "contractual" ? existing : null,
      }
    );
    errors.push(...contractualErrors);
    Object.assign(data, contractualData);

    if (currentTier !== "contractual" && !existing.inviteCode) {
      data.inviteCode = await generateUniqueInviteCode();
    }
    return { errors, data };
  }

  if (currentTier === "contractual") {
    const companyOid = new mongoose.Types.ObjectId(companyId);
    const partyOid = existing._id;
    const [asClient, subsidiaries] = await Promise.all([
      SupplyChain.countDocuments({ companyId: companyOid, contractualPartyId: partyOid }),
      Party.countDocuments({
        companyId: companyOid,
        parentPartyId: partyOid,
        accountTier: "contractual",
      }),
    ]);

    if (asClient > 0) {
      errors.push(
        "Cannot set as operational while this party is the contractual client on a supply chain. Reassign the chain first."
      );
    }
    if (subsidiaries > 0) {
      errors.push(
        "Cannot set as operational while contractual subsidiary parties reference this party as parent."
      );
    }

    if (errors.length === 0) {
      data.accountTier = "operational";
      data.contractualTier = "primary";
      data.parentPartyId = null;
    }
  }

  return { errors, data };
}
