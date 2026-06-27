import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Facility } from "../models/Facility.js";
import { Party } from "../models/Party.js";
import {
  buildFacilityRelationshipRows,
  buildPartyRelationshipRows,
  filterFacilityRelationshipRows,
  filterPartyRelationshipRows,
  paginateRelationshipRows,
} from "../services/tradeMasters/relationshipIndex.js";
import {
  getTradeAccess,
  partyIdsForClient,
  portalClientObjectId,
} from "../services/tradeMasters/tradeScope.js";
import { devError } from "../utils/devLog.js";
import { parseListQuery } from "../utils/listQuery.js";
import { companyObjectId, dbUnavailable } from "./controllerHelpers.js";

const PARTY_FIELDS =
  "code legalName accountTier contractualTier parentPartyId relatedParties aliases relatedFacilities";

async function loadScopedParties(companyOid, companyId, portalClientId) {
  const filter = { companyId: companyOid };
  if (portalClientId) {
    const portalOid = portalClientObjectId(portalClientId);
    const or = [{ _id: portalOid }];
    const inNetworkIds = await partyIdsForClient(companyId, portalClientId);
    if (inNetworkIds.length > 0) {
      or.push({ _id: { $in: inNetworkIds.map((id) => new mongoose.Types.ObjectId(id)) } });
    }
    filter.$or = or;
  }
  return Party.find(filter).select(PARTY_FIELDS).lean();
}

export async function listPartyRelationships(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  try {
    const companyOid = companyObjectId(req.user.companyId);
    const { portalClientId } = getTradeAccess(req);
    const { limit, skip } = parseListQuery(req.query);
    const parties = await loadScopedParties(companyOid, req.user.companyId, portalClientId);
    const rows = buildPartyRelationshipRows(parties);
    const filtered = filterPartyRelationshipRows(rows, req.query);
    const page = paginateRelationshipRows(filtered, skip, limit);
    return res.json(page);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list party relationships." });
  }
}

export async function listFacilityRelationships(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  try {
    const companyOid = companyObjectId(req.user.companyId);
    const { portalClientId } = getTradeAccess(req);
    const { limit, skip } = parseListQuery(req.query);
    const parties = await loadScopedParties(companyOid, req.user.companyId, portalClientId);
    const facilityIds = [
      ...new Set(
        parties.flatMap((party) => (party.relatedFacilities ?? []).map((row) => String(row.facilityId)))
      ),
    ].filter(Boolean);

    const facilities =
      facilityIds.length > 0
        ? await Facility.find({ companyId: companyOid, _id: { $in: facilityIds } })
            .select("code name city country")
            .lean()
        : [];

    const rows = buildFacilityRelationshipRows(parties, facilities);
    const filtered = filterFacilityRelationshipRows(rows, req.query);
    const page = paginateRelationshipRows(filtered, skip, limit);
    return res.json(page);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list facility relationships." });
  }
}
