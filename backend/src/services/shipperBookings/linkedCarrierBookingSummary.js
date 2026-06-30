import mongoose from "mongoose";
import { CarrierBookingRequest } from "../../models/CarrierBookingRequest.js";

const STATUS_PRIORITY = {
  confirmed: 6,
  acknowledged: 5,
  submitted: 4,
  draft: 3,
  rejected: 2,
  failed: 2,
  cancelled: 1,
};

function pickPrimaryCarrierBooking(rows) {
  if (!rows.length) return null;
  return rows.reduce((best, row) => {
    const bestScore = STATUS_PRIORITY[best.status] ?? 0;
    const rowScore = STATUS_PRIORITY[row.status] ?? 0;
    if (rowScore !== bestScore) return rowScore > bestScore ? row : best;
    const bestUpdated = new Date(best.updatedAt ?? 0).getTime();
    const rowUpdated = new Date(row.updatedAt ?? 0).getTime();
    return rowUpdated > bestUpdated ? row : best;
  });
}

export async function resolveLinkedCarrierBookingSummary(companyOid, shipperBookingId) {
  if (!mongoose.isValidObjectId(shipperBookingId)) return null;

  const oid = new mongoose.Types.ObjectId(shipperBookingId);
  const rows = await CarrierBookingRequest.find({
    companyId: companyOid,
    $or: [{ shipperBookingId: oid }, { shipperBookingIds: oid }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (rows.length === 0) return null;

  const primary = pickPrimaryCarrierBooking(rows);
  return {
    carrierBookingId: String(primary._id),
    requestReference: primary.requestReference ?? "",
    status: primary.status ?? "draft",
    externalReference: primary.externalReference ?? "",
    count: rows.length,
  };
}
