import {
  aggregateShipperBookingsForCarrierBooking,
  assertCompatibleShipperBookings,
} from "./aggregateShipperBookings.js";
import { logCarrierBookingEvent } from "./carrierBookingEvents.js";

function idsEqual(left, right) {
  const a = [...left].map(String).sort();
  const b = [...right].map(String).sort();
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

/**
 * Apply shipper booking link changes to a carrier booking document.
 * @returns {{ linkedRefs: string[], unlinkedRefs: string[] }}
 */
export function applyShipperBookingLinkChanges({
  existing,
  previousIds,
  previousRefsById,
  nextIds,
  shipperBookings,
  refreshFromShipperBookings,
  hasExplicitCargoLines,
}) {
  const normalizedNextIds = [...new Set((nextIds ?? []).map(String))];

  if (normalizedNextIds.length === 0) {
    existing.shipperBookingIds = [];
    existing.shipperBookingId = null;
    existing.shipperBookingReferences = [];
    existing.shipperBookingReference = "";
    return {
      linkedRefs: [],
      unlinkedRefs: previousIds
        .filter((id) => !normalizedNextIds.includes(id))
        .map((id) => previousRefsById.get(String(id)) || String(id)),
    };
  }

  const compatError = assertCompatibleShipperBookings(shipperBookings);
  if (compatError) {
    throw new Error(compatError);
  }

  const aggregated = aggregateShipperBookingsForCarrierBooking(shipperBookings);
  existing.shipperBookingIds = aggregated.shipperBookingIds;
  existing.shipperBookingId = shipperBookings[0]._id;
  existing.shipperBookingReferences = aggregated.shipperBookingReferences;
  existing.shipperBookingReference = aggregated.shipperBookingReference;

  const shouldRefreshCargo =
    refreshFromShipperBookings || (!hasExplicitCargoLines && !(existing.cargoLines?.length > 0));

  if (shouldRefreshCargo) {
    existing.cargoLines = aggregated.cargoLines;
    existing.cargoDescription = aggregated.cargoDescription;
    existing.totalGrossWeightKg = aggregated.totalGrossWeightKg;
    existing.totalVolumeCbm = aggregated.totalVolumeCbm;
    existing.totalPackages = aggregated.totalPackages;
  }

  const refById = new Map(shipperBookings.map((row) => [String(row._id), row.bookingReference ?? ""]));
  const linkedRefs = normalizedNextIds
    .filter((id) => !previousIds.includes(id))
    .map((id) => refById.get(id) || previousRefsById.get(id) || id);
  const unlinkedRefs = previousIds
    .filter((id) => !normalizedNextIds.includes(id))
    .map((id) => previousRefsById.get(String(id)) || String(id));

  return { linkedRefs, unlinkedRefs };
}

export async function logShipperBookingLinkEvents({
  carrierBookingRequestId,
  companyOid,
  actorUserId,
  actorEmail,
  linkedRefs,
  unlinkedRefs,
}) {
  for (const ref of linkedRefs) {
    await logCarrierBookingEvent({
      carrierBookingRequestId,
      companyId: companyOid,
      kind: "sb_linked",
      message: `Linked shipper booking ${ref}`,
      actorUserId,
      actorEmail,
      meta: { shipperBookingReference: ref },
    });
  }

  for (const ref of unlinkedRefs) {
    await logCarrierBookingEvent({
      carrierBookingRequestId,
      companyId: companyOid,
      kind: "sb_unlinked",
      message: `Unlinked shipper booking ${ref}`,
      actorUserId,
      actorEmail,
      meta: { shipperBookingReference: ref },
    });
  }
}

export { idsEqual };
