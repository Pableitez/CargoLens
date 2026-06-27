import { api } from "./client.js";
import { fetchAllPages, type PaginatedResponse } from "./listQuery.js";
import type {
  ShipperBooking,
  ShipperBookingEvent,
  ShipperBookingImportPreview,
  ShipperBookingImportResult,
} from "../features/shipperBookings/types";

export async function fetchShipperBookings(params: { status?: string } = {}): Promise<ShipperBooking[]> {
  return fetchAllPages(async (skip, limit) => {
    const { data } = await api.get<PaginatedResponse<ShipperBooking>>("/shipper-bookings", {
      params: { ...params, skip, limit },
    });
    return data;
  });
}

export async function fetchNextBookingReference(): Promise<string> {
  const { data } = await api.get<{ bookingReference: string }>("/shipper-bookings/next-reference");
  return data.bookingReference;
}

export async function fetchShipperBooking(
  id: string
): Promise<{ item: ShipperBooking; events: ShipperBookingEvent[] }> {
  const { data } = await api.get<{ item: ShipperBooking; events: ShipperBookingEvent[] }>(
    `/shipper-bookings/${id}`
  );
  return data;
}

export async function createShipperBooking(body: Record<string, unknown>): Promise<ShipperBooking> {
  const { data } = await api.post<{ item: ShipperBooking }>("/shipper-bookings", body);
  return data.item;
}

export async function updateShipperBooking(
  id: string,
  body: Record<string, unknown>
): Promise<ShipperBooking> {
  const { data } = await api.patch<{ item: ShipperBooking }>(`/shipper-bookings/${id}`, body);
  return data.item;
}

export async function deleteShipperBooking(id: string): Promise<void> {
  await api.delete(`/shipper-bookings/${id}`);
}

export async function createShipperBookingEvent(
  id: string,
  payload: { kind: "note" | "milestone"; message: string; visibleToClient?: boolean }
): Promise<ShipperBookingEvent> {
  const { data } = await api.post<{ item: ShipperBookingEvent }>(`/shipper-bookings/${id}/events`, payload);
  return data.item;
}

export async function previewShipperBookingImport(file: File): Promise<ShipperBookingImportPreview> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<ShipperBookingImportPreview>("/shipper-bookings/import/preview", body);
  return data;
}

export async function importShipperBookingsFile(file: File): Promise<ShipperBookingImportResult> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<ShipperBookingImportResult>("/shipper-bookings/import", body);
  return data;
}
