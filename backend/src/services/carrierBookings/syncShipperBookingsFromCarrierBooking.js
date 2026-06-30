import mongoose from "mongoose";
import { ShipperBooking } from "../../models/ShipperBooking.js";
import { logShipperBookingEvent } from "../shipperBookings/shipperBookingEvents.js";

const CARRIER_STATUS_PRIORITY = {
  confirmed: 5,
  acknowledged: 4,
  submitted: 3,
  draft: 2,
  rejected: 1,
  failed: 1,
  cancelled: 0,
};

function collectShipperBookingIds(carrierBooking) {
  const ids = new Set();
  for (const id of carrierBooking.shipperBookingIds ?? []) {
    if (id) ids.add(String(id));
  }
  if (carrierBooking.shipperBookingId) {
    ids.add(String(carrierBooking.shipperBookingId));
  }
  return [...ids].filter((id) => mongoose.isValidObjectId(id));
}

/**
 * Reflect carrier booking outcomes on linked shipper bookings (status + timeline).
 */
export async function syncShipperBookingsFromCarrierBooking(companyOid, carrierBooking, actor = null) {
  const carrierStatus = String(carrierBooking.status ?? "")
    .trim()
    .toLowerCase();
  if (!CARRIER_STATUS_PRIORITY[carrierStatus]) return;

  const shipperBookingIds = collectShipperBookingIds(carrierBooking);
  if (shipperBookingIds.length === 0) return;

  const requestReference = carrierBooking.requestReference ?? "";
  const actorUserId = actor?.id ?? actor?.userId ?? null;
  const actorEmail = actor?.email ?? "";

  for (const shipperBookingId of shipperBookingIds) {
    const bookingDoc = await ShipperBooking.findOne({
      _id: shipperBookingId,
      companyId: companyOid,
    });
    if (!bookingDoc || bookingDoc.status === "cancelled") continue;

    if (carrierStatus === "confirmed" && bookingDoc.status !== "confirmed") {
      const previousStatus = bookingDoc.status;
      bookingDoc.status = "confirmed";
      await bookingDoc.save();

      await logShipperBookingEvent({
        shipperBookingId: bookingDoc._id,
        companyId: companyOid,
        kind: "status_change",
        message: `Status confirmed — carrier booking ${requestReference} confirmed`,
        actorUserId,
        actorEmail,
        meta: {
          from: previousStatus,
          to: "confirmed",
          source: "carrier_booking",
          carrierBookingRequestId: String(carrierBooking._id ?? ""),
          requestReference,
        },
      });
      continue;
    }

    await logShipperBookingEvent({
      shipperBookingId: bookingDoc._id,
      companyId: companyOid,
      kind: "milestone",
      message: `Carrier booking ${requestReference} — ${carrierStatus}`,
      actorUserId,
      actorEmail,
      meta: {
        carrierStatus,
        carrierBookingRequestId: String(carrierBooking._id ?? ""),
        requestReference,
        source: "carrier_booking",
      },
    });
  }
}
