import type { CarrierBookingRequest, CarrierBookingStatus } from "./types";

const SHIPPER_BOOKING_BASE = "/dashboard/operations/export/shipper-booking";

export type ShipperBookingLink = {
  id: string;
  ref: string;
};

export function shipperBookingLinksFromCarrierRow(row: CarrierBookingRequest): ShipperBookingLink[] {
  const ids = row.shipperBookingIds ?? [];
  const refs =
    row.shipperBookingReferences?.length > 0
      ? row.shipperBookingReferences
      : String(row.shipperBookingReference ?? "")
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);

  if (ids.length === 0 && refs.length === 0) return [];

  if (ids.length > 0) {
    return ids.map((id, index) => ({ id, ref: refs[index] ?? id }));
  }

  return refs.map((ref) => ({ id: "", ref }));
}

export { SHIPPER_BOOKING_BASE };

type TranslateFn = (key: string) => string;

export function carrierBookingStatusClass(status: CarrierBookingStatus): string {
  return `order-status order-status--${status}`;
}

export function carrierBookingStatusLabel(status: CarrierBookingStatus, t: TranslateFn): string {
  return t(`carrierBookingsPage.status.${status}`);
}

export function formatCarrierBookingDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function canEditCarrierBooking(status: CarrierBookingStatus): boolean {
  return (
    status === "draft" ||
    status === "rejected" ||
    status === "failed" ||
    status === "acknowledged" ||
    status === "confirmed"
  );
}

export function canSubmitCarrierBooking(status: CarrierBookingStatus): boolean {
  return canEditCarrierBooking(status);
}

export function hasUnsentCarrierAmendments(item: CarrierBookingRequest): boolean {
  if (!item.submittedAt) return false;
  if (item.status !== "acknowledged" && item.status !== "confirmed") return false;
  const submitted = new Date(item.submittedAt).getTime();
  const updated = new Date(item.updatedAt).getTime();
  if (Number.isNaN(submitted) || Number.isNaN(updated)) return false;
  return updated > submitted;
}

export function canDeleteCarrierBooking(status: CarrierBookingStatus): boolean {
  return status === "draft";
}
