import { CarrierBookingRequest } from "../../models/CarrierBookingRequest.js";
import { CompanyBookingCounter } from "../../models/CompanyBookingCounter.js";

export const CARRIER_BOOKING_REF_PREFIX = "CB";
export const CARRIER_BOOKING_REF_SEQ_WIDTH = 5;
export const CARRIER_BOOKING_COUNTER_KIND = "carrier";

export function parseCarrierBookingReferenceSequence(requestReference, year) {
  const raw = String(requestReference ?? "").trim();
  if (!raw) return 0;

  const patterns = [
    new RegExp(`^${CARRIER_BOOKING_REF_PREFIX}${year}(\\d+)$`, "i"),
    new RegExp(`^${CARRIER_BOOKING_REF_PREFIX}-${year}-(\\d+)$`, "i"),
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match) continue;
    const seq = Number.parseInt(match[1], 10);
    if (Number.isFinite(seq)) return seq;
  }

  return 0;
}

export function formatCarrierBookingReference(year, sequence) {
  return `${CARRIER_BOOKING_REF_PREFIX}${year}${String(sequence).padStart(CARRIER_BOOKING_REF_SEQ_WIDTH, "0")}`;
}

async function maxSequenceFromExistingRequests(companyObjectId, year) {
  const rows = await CarrierBookingRequest.find({ companyId: companyObjectId })
    .select("requestReference")
    .lean();
  let maxSeq = 0;
  for (const row of rows) {
    maxSeq = Math.max(maxSeq, parseCarrierBookingReferenceSequence(row.requestReference, year));
  }
  return maxSeq;
}

async function ensureCounterInitialized(companyObjectId, year) {
  const existing = await CompanyBookingCounter.findOne({
    companyId: companyObjectId,
    year,
    kind: CARRIER_BOOKING_COUNTER_KIND,
  }).lean();
  if (existing) return existing;

  const maxSeq = await maxSequenceFromExistingRequests(companyObjectId, year);
  try {
    return await CompanyBookingCounter.create({
      companyId: companyObjectId,
      year,
      kind: CARRIER_BOOKING_COUNTER_KIND,
      seq: maxSeq,
    });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    return CompanyBookingCounter.findOne({
      companyId: companyObjectId,
      year,
      kind: CARRIER_BOOKING_COUNTER_KIND,
    }).lean();
  }
}

export async function previewNextCarrierBookingReference(
  companyObjectId,
  { year = new Date().getFullYear() } = {}
) {
  await ensureCounterInitialized(companyObjectId, year);

  const counter = await CompanyBookingCounter.findOne({
    companyId: companyObjectId,
    year,
    kind: CARRIER_BOOKING_COUNTER_KIND,
  }).lean();

  return formatCarrierBookingReference(year, (counter?.seq ?? 0) + 1);
}

export async function allocateNextCarrierBookingReference(
  companyObjectId,
  { year = new Date().getFullYear() } = {}
) {
  await ensureCounterInitialized(companyObjectId, year);

  const updated = await CompanyBookingCounter.findOneAndUpdate(
    { companyId: companyObjectId, year, kind: CARRIER_BOOKING_COUNTER_KIND },
    { $inc: { seq: 1 } },
    { returnDocument: "after" }
  ).lean();

  if (!updated) {
    throw new Error("Failed to allocate carrier booking reference counter.");
  }

  return formatCarrierBookingReference(year, updated.seq);
}

export async function isCarrierBookingReferenceTaken(companyObjectId, requestReference) {
  const key = String(requestReference ?? "").trim();
  if (!key) return true;

  const existing = await CarrierBookingRequest.findOne({
    companyId: companyObjectId,
    requestReference: key,
  }).lean();

  return Boolean(existing);
}
