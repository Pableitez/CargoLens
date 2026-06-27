import { api } from "./client.js";
import { fetchAllPages, type PaginatedResponse } from "./listQuery.js";
import type {
  Order,
  OrderEvent,
  OrderImportPreview,
  OrderImportResult,
  OrderBookableLinesResponse,
} from "../features/orders/types";

export async function fetchOrders(params: { status?: string } = {}): Promise<Order[]> {
  return fetchAllPages(async (skip, limit) => {
    const { data } = await api.get<PaginatedResponse<Order>>("/orders", {
      params: { ...params, skip, limit },
    });
    return data;
  });
}

export async function fetchOrder(id: string): Promise<{ item: Order; events: OrderEvent[] }> {
  const { data } = await api.get<{ item: Order; events: OrderEvent[] }>(`/orders/${id}`);
  return data;
}

export async function fetchOrderBookableLines(
  orderNumber: string,
  excludeBookingId?: string
): Promise<OrderBookableLinesResponse> {
  const { data } = await api.get<OrderBookableLinesResponse>("/orders/bookable-lines", {
    params: { orderNumber, excludeBookingId },
  });
  return data;
}

export type OrderTradePartyOption = {
  partyId: string;
  partyCode: string;
  partyLegalName: string;
  role?: string;
};

export type OrderTradePartyOptionsResponse = {
  shippers: OrderTradePartyOption[];
  consignees: OrderTradePartyOption[];
  defaults: {
    incoterm: string;
    transportMode: string;
    portOfLoading: string;
    portOfDischarge: string;
  } | null;
  primaryClientId: string;
};

export type TradeFacilityOption = {
  facilityId: string;
  code: string;
  name: string;
  facilityType: string;
  city: string;
  country: string;
  locationCode: string;
  purpose: string;
  isPrimary: boolean;
};

export type OrderTradeFacilityOptionsResponse = {
  placeOfReceipt: TradeFacilityOption[];
  portOfLoading: TradeFacilityOption[];
  portOfDischarge: TradeFacilityOption[];
  placeOfDelivery: TradeFacilityOption[];
};

export async function fetchOrderTradePartyOptions(
  contractualPartyId: string
): Promise<OrderTradePartyOptionsResponse> {
  const { data } = await api.get<OrderTradePartyOptionsResponse>("/orders/trade-party-options", {
    params: { contractualPartyId },
  });
  return data;
}

export async function fetchOrderTradeFacilityOptions(params: {
  operatingShipperPartyId?: string;
  operatingConsigneePartyId?: string;
}): Promise<OrderTradeFacilityOptionsResponse> {
  const { data } = await api.get<OrderTradeFacilityOptionsResponse>("/orders/trade-facility-options", {
    params,
  });
  return data;
}

export async function fetchOrderTradeContext(): Promise<{ usesTradeMasters: boolean }> {
  const { data } = await api.get<{ usesTradeMasters: boolean }>("/orders/trade-context");
  return data;
}

export async function createOrder(body: Record<string, unknown>): Promise<Order> {
  const { data } = await api.post<{ item: Order }>("/orders", body);
  return data.item;
}

export async function updateOrder(id: string, body: Record<string, unknown>): Promise<Order> {
  const { data } = await api.patch<{ item: Order }>(`/orders/${id}`, body);
  return data.item;
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete(`/orders/${id}`);
}

export async function createOrderEvent(
  id: string,
  payload: { kind: "note" | "milestone"; message: string; visibleToClient?: boolean }
): Promise<OrderEvent> {
  const { data } = await api.post<{ item: OrderEvent }>(`/orders/${id}/events`, payload);
  return data.item;
}

export async function previewOrderImport(file: File): Promise<OrderImportPreview> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<OrderImportPreview>("/orders/import/preview", body);
  return data;
}

export async function importOrdersFile(file: File): Promise<OrderImportResult> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<OrderImportResult>("/orders/import", body);
  return data;
}
