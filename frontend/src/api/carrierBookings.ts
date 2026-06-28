import { api } from "./client.js";
import { fetchAllPages, type PaginatedResponse } from "./listQuery.js";
import type { CarrierBookingEvent, CarrierBookingRequest } from "../features/carrierBookings/types";

export async function fetchCarrierBookings(
  params: {
    status?: string;
    shipperBookingId?: string;
  } = {}
): Promise<CarrierBookingRequest[]> {
  return fetchAllPages(async (skip, limit) => {
    const { data } = await api.get<PaginatedResponse<CarrierBookingRequest>>("/carrier-bookings", {
      params: { ...params, skip, limit },
    });
    return data;
  });
}

export async function fetchNextCarrierBookingReference(): Promise<string> {
  const { data } = await api.get<{ requestReference: string }>("/carrier-bookings/next-reference");
  return data.requestReference;
}

export async function fetchCarrierBooking(
  id: string
): Promise<{ item: CarrierBookingRequest; events: CarrierBookingEvent[] }> {
  const { data } = await api.get<{ item: CarrierBookingRequest; events: CarrierBookingEvent[] }>(
    `/carrier-bookings/${id}`
  );
  return data;
}

export async function createCarrierBooking(body: Record<string, unknown>): Promise<CarrierBookingRequest> {
  const { data } = await api.post<{ item: CarrierBookingRequest }>("/carrier-bookings", body);
  return data.item;
}

export async function updateCarrierBooking(
  id: string,
  body: Record<string, unknown>
): Promise<CarrierBookingRequest> {
  const { data } = await api.patch<{ item: CarrierBookingRequest }>(`/carrier-bookings/${id}`, body);
  return data.item;
}

export async function deleteCarrierBooking(id: string): Promise<void> {
  await api.delete(`/carrier-bookings/${id}`);
}

export async function submitCarrierBooking(
  id: string
): Promise<{ item: CarrierBookingRequest; source: string }> {
  const { data } = await api.post<{ item: CarrierBookingRequest; source: string }>(
    `/carrier-bookings/${id}/submit`
  );
  return data;
}

export async function createCarrierBookingEvent(
  id: string,
  payload: { message: string }
): Promise<CarrierBookingEvent> {
  const { data } = await api.post<{ item: CarrierBookingEvent }>(`/carrier-bookings/${id}/events`, payload);
  return data.item;
}
