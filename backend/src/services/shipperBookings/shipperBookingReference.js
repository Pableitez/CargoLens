import { ShipperBooking } from "../../models/ShipperBooking.js";
import { CompanyBookingCounter } from "../../models/CompanyBookingCounter.js";

export const BOOKING_REF_PREFIX = "SB";
export const BOOKING_REF_SEQ_WIDTH = 5;
export const BOOKING_COUNTER_KIND = "shipper";

export function parseBookingReferenceSequence(bookingReference, year) {
  const raw = String(bookingReference ?? "").trim();
  if (!raw) return 0;

  const patterns = [
    new RegExp(`^${BOOKING_REF_PREFIX}${year}(\\d+)$`, "i"),
    new RegExp(`^${BOOKING_REF_PREFIX}-${year}-(\\d+)$`, "i"),
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match) continue;
    const seq = Number.parseInt(match[1], 10);
    if (Number.isFinite(seq)) return seq;
  }

  return 0;
}

export function formatBookingReference(year, sequence) {
  return `${BOOKING_REF_PREFIX}${year}${String(sequence).padStart(BOOKING_REF_SEQ_WIDTH, "0")}`;
}

async function maxSequenceFromExistingBookings(companyObjectId, year) {
  const rows = await ShipperBooking.find({ companyId: companyObjectId }).select("bookingReference").lean();
  let maxSeq = 0;
  for (const row of rows) {
    maxSeq = Math.max(maxSeq, parseBookingReferenceSequence(row.bookingReference, year));
  }
  return maxSeq;
}

async function ensureCounterInitialized(companyObjectId, year) {
  const existing = await CompanyBookingCounter.findOne({ companyId: companyObjectId, year }).lean();
  if (existing) return existing;

  const maxSeq = await maxSequenceFromExistingBookings(companyObjectId, year);
  try {
    return await CompanyBookingCounter.create({
      companyId: companyObjectId,
      year,
      seq: maxSeq,
    });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    return CompanyBookingCounter.findOne({ companyId: companyObjectId, year }).lean();
  }
}

export async function allocateNextBookingReference(
  companyObjectId,
  { year = new Date().getFullYear() } = {}
) {
  await ensureCounterInitialized(companyObjectId, year);

  const updated = await CompanyBookingCounter.findOneAndUpdate(
    { companyId: companyObjectId, year },
    { $inc: { seq: 1 } },
    { new: true }
  ).lean();

  if (!updated) {
    throw new Error("Failed to allocate booking reference counter.");
  }

  return formatBookingReference(year, updated.seq);
}

export async function isBookingReferenceTaken(companyObjectId, bookingReference) {
  const key = String(bookingReference ?? "").trim();
  if (!key) return true;

  const existing = await ShipperBooking.findOne({
    companyId: companyObjectId,
    bookingReference: key,
  }).lean();

  return Boolean(existing);
}
