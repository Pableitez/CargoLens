import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { Party } from "../models/Party.js";
import { Facility } from "../models/Facility.js";
import { serializeFacility, validateFacilityInput } from "../services/tradeMasters/facilityValidation.js";
import { syncPortFacilitiesFromCatalog } from "../services/tradeMasters/portFacilitiesSync.js";
import { devError } from "../utils/devLog.js";
import { buildTextSearchFilter, mergeFilters } from "../utils/textSearch.js";
import { paginatedFind, parseListQuery } from "../utils/listQuery.js";
import { companyObjectId, dbUnavailable } from "./controllerHelpers.js";

const MAX_BULK_ITEMS = 200;

export async function listFacilities(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  try {
    const companyId = req.user.companyId;
    const companyOid = companyObjectId(companyId);
    const { limit, skip } = parseListQuery(req.query);
    const q = String(req.query.q ?? "").trim();
    const field = String(req.query.field ?? "").trim();
    const facilityFields = ["code", "name", "locationCode", "city", "country", "line1", "facilityType"];
    const textFilter =
      q && field && facilityFields.includes(field)
        ? buildTextSearchFilter(q, [field])
        : buildTextSearchFilter(q, facilityFields);

    if (skip === 0 && !q) {
      await syncPortFacilitiesFromCatalog(companyId);
    }
    const filter = mergeFilters({ companyId: companyOid }, textFilter);

    const result = await paginatedFind(Facility, filter, {
      sort: { facilityType: 1, code: 1 },
      limit,
      skip,
      serialize: serializeFacility,
    });
    return res.json(result);
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to list facilities." });
  }
}

export async function getFacility(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid facility id." });
  }

  try {
    const row = await Facility.findOne({
      _id: id,
      companyId: companyObjectId(req.user.companyId),
    }).lean();
    if (!row) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Facility not found." });
    }
    return res.json({ item: serializeFacility(row) });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to load facility." });
  }
}

export async function createFacility(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { errors, data } = validateFacilityInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }
  if (data.facilityType === "port") {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: "Ports are created from the UN/LOCODE catalog automatically.",
    });
  }

  try {
    const doc = await Facility.create({ companyId: req.user.companyId, catalogSource: "manual", ...data });
    return res.status(201).json({ item: serializeFacility(doc) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "DUPLICATE", message: "Facility code already exists." });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create facility." });
  }
}

export async function createFacilitiesBulk(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const rawItems = req.body?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "items array is required." });
  }
  if (rawItems.length > MAX_BULK_ITEMS) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      message: `At most ${MAX_BULK_ITEMS} facilities per request.`,
    });
  }

  const items = [];
  const errors = [];

  for (let index = 0; index < rawItems.length; index += 1) {
    const { errors: rowErrors, data } = validateFacilityInput(rawItems[index]);
    if (rowErrors.length > 0) {
      errors.push({ index, message: rowErrors.join(" ") });
      continue;
    }
    if (data.facilityType === "port") {
      errors.push({ index, message: "Ports are managed via UN/LOCODE catalog." });
      continue;
    }
    try {
      const doc = await Facility.create({
        companyId: req.user.companyId,
        catalogSource: "manual",
        ...data,
      });
      items.push(serializeFacility(doc));
    } catch (err) {
      if (err?.code === 11000) {
        errors.push({ index, message: "Facility code already exists." });
      } else {
        devError(err);
        errors.push({ index, message: "Could not create facility." });
      }
    }
  }

  if (items.length === 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "No facilities were created.", errors });
  }
  return res.status(201).json({ items, errors });
}

export async function updateFacility(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid facility id." });
  }

  const { errors, data } = validateFacilityInput(req.body, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: errors.join(" ") });
  }

  try {
    const doc = await Facility.findOneAndUpdate(
      { _id: id, companyId: companyObjectId(req.user.companyId) },
      { $set: data },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Facility not found." });
    }
    return res.json({ item: serializeFacility(doc) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "DUPLICATE", message: "Facility code already exists." });
    }
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not update facility." });
  }
}

export async function deleteFacility(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Invalid facility id." });
  }

  try {
    const companyOid = companyObjectId(req.user.companyId);
    const result = await Facility.deleteOne({
      _id: id,
      companyId: companyOid,
      catalogSource: { $ne: "unloc" },
    });
    if (result.deletedCount === 0) {
      const exists = await Facility.exists({ _id: id, companyId: companyOid, catalogSource: "unloc" });
      if (exists) {
        return res.status(400).json({
          error: "INVALID_INPUT",
          message: "UN/LOCODE ports from the catalog cannot be deleted.",
        });
      }
      return res.status(404).json({ error: "NOT_FOUND", message: "Facility not found." });
    }
    await Party.updateMany(
      { companyId: companyOid },
      { $pull: { relatedFacilities: { facilityId: new mongoose.Types.ObjectId(id) } } }
    );
    return res.status(204).send();
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete facility." });
  }
}
