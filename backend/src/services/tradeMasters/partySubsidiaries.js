import mongoose from "mongoose";
import { Party } from "../../models/Party.js";
import { SupplyChain } from "../../models/SupplyChain.js";
import { generateClientInviteCode } from "../../utils/clientInviteCode.js";

async function generateUniqueInviteCode() {
  for (let i = 0; i < 8; i += 1) {
    const inviteCode = generateClientInviteCode();
    const clash = await Party.findOne({ inviteCode }).select("_id").lean();
    if (!clash) return inviteCode;
  }
  return generateClientInviteCode();
}

export function serializePartySubsidiary(doc) {
  return {
    id: String(doc._id),
    code: doc.code ?? "",
    legalName: doc.legalName ?? "",
    country: doc.country ?? "",
    vat: doc.vat ?? "",
  };
}

export async function loadPartySubsidiaries(companyId, parentPartyId) {
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const docs = await Party.find({
    companyId: companyOid,
    parentPartyId,
    accountTier: "contractual",
    contractualTier: "subsidiary",
  })
    .select("code legalName country vat")
    .sort({ legalName: 1 })
    .lean();
  return docs.map(serializePartySubsidiary);
}

async function assertCanBecomeSubsidiary(companyOid, candidate, parentId, errors) {
  if (String(candidate._id) === String(parentId)) {
    errors.push("A party cannot be its own subsidiary.");
    return;
  }
  if ((candidate.accountTier ?? "operational") !== "operational") {
    errors.push(`${candidate.legalName} must be an operational party to link as a subsidiary.`);
    return;
  }
  if (candidate.parentPartyId && String(candidate.parentPartyId) !== String(parentId)) {
    errors.push(`${candidate.legalName} is already a subsidiary of another party.`);
    return;
  }
  const childCount = await Party.countDocuments({
    companyId: companyOid,
    parentPartyId: candidate._id,
    accountTier: "contractual",
  });
  if (childCount > 0) {
    errors.push(`${candidate.legalName} has subsidiaries and cannot become a subsidiary.`);
    return;
  }
  if (
    (candidate.accountTier ?? "operational") === "contractual" &&
    (candidate.contractualTier ?? "primary") === "primary"
  ) {
    const asChainClient = await SupplyChain.countDocuments({
      companyId: companyOid,
      contractualPartyId: candidate._id,
    });
    if (asChainClient > 0) {
      errors.push(
        `${candidate.legalName} is a contractual primary on supply chains and cannot become a subsidiary.`
      );
    }
  }
}

async function promoteParentToContractualPrimary(parentParty) {
  const patch = {
    accountTier: "contractual",
    contractualTier: "primary",
    parentPartyId: null,
  };
  if (!parentParty.inviteCode) {
    patch.inviteCode = await generateUniqueInviteCode();
  }
  await Party.updateOne({ _id: parentParty._id }, { $set: patch });
}

export async function mutatePartySubsidiaries(parentParty, { addIds = [], removeIds = [] }, companyId) {
  const errors = [];
  const companyOid = new mongoose.Types.ObjectId(companyId);
  const parentId = parentParty._id;

  if (parentParty.parentPartyId) {
    errors.push("Subsidiaries can only be managed from a primary party profile.");
    return { errors };
  }

  const normalizedAdd = [...new Set(addIds.map(String).filter(Boolean))];
  const normalizedRemove = [...new Set(removeIds.map(String).filter(Boolean))];

  for (const id of [...normalizedAdd, ...normalizedRemove]) {
    if (!mongoose.isValidObjectId(id)) {
      errors.push("Invalid subsidiary party id.");
      return { errors };
    }
  }

  if (normalizedAdd.length > 0) {
    const addOids = normalizedAdd.map((id) => new mongoose.Types.ObjectId(id));
    const candidates = await Party.find({ companyId: companyOid, _id: { $in: addOids } }).lean();
    if (candidates.length !== addOids.length) {
      errors.push("One or more subsidiary parties were not found in this company.");
      return { errors };
    }
    for (const candidate of candidates) {
      await assertCanBecomeSubsidiary(companyOid, candidate, parentId, errors);
    }
    if (errors.length > 0) return { errors };

    await promoteParentToContractualPrimary(parentParty);

    for (const candidate of candidates) {
      await Party.updateOne(
        { _id: candidate._id, companyId: companyOid },
        {
          $set: {
            accountTier: "contractual",
            contractualTier: "subsidiary",
            parentPartyId: parentId,
          },
        }
      );
    }
  }

  if (normalizedRemove.length > 0) {
    const removeOids = normalizedRemove.map((id) => new mongoose.Types.ObjectId(id));
    const linked = await Party.find({
      companyId: companyOid,
      _id: { $in: removeOids },
      parentPartyId: parentId,
      accountTier: "contractual",
      contractualTier: "subsidiary",
    }).lean();

    for (const row of linked) {
      const asChainClient = await SupplyChain.countDocuments({
        companyId: companyOid,
        contractualPartyId: row._id,
      });
      if (asChainClient > 0) {
        errors.push(
          `Cannot unlink ${row.legalName}: it is referenced on a supply chain as contractual client.`
        );
      }
    }
    if (errors.length > 0) return { errors };

    for (const row of linked) {
      await Party.updateOne(
        { _id: row._id, companyId: companyOid },
        {
          $set: {
            accountTier: "operational",
            contractualTier: "primary",
            parentPartyId: null,
            inviteCode: "",
          },
        }
      );
    }
  }

  return { errors: [] };
}
