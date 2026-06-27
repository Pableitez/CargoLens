import { api } from "./client.js";
import type { PaginatedResponse } from "./listQuery";
import { fetchAllPages } from "./listQuery";

export type Facility = {
  id: string;
  code: string;
  name: string;
  facilityType: string;
  line1: string;
  line2: string;
  city: string;
  country: string;
  postalCode: string;
  locationCode: string;
  notes: string;
  isActive: boolean;
  catalogSource?: "unloc" | "manual";
  createdAt: string;
  updatedAt: string;
};

export type FacilityCreate = Pick<
  Facility,
  "code" | "name" | "line1" | "line2" | "city" | "country" | "postalCode" | "locationCode" | "notes"
> & {
  facilityType?: string;
};

export type FacilityListParams = {
  q?: string;
  field?: string;
  skip?: number;
  limit?: number;
};

export async function fetchFacilitiesPage(params: FacilityListParams = {}) {
  const { data } = await api.get<PaginatedResponse<Facility>>("/facilities", { params });
  return data;
}

export async function fetchFacilities(params: FacilityListParams = {}) {
  if (params.q || params.skip !== undefined || params.limit !== undefined) {
    const page = await fetchFacilitiesPage(params);
    return page.items;
  }
  return fetchAllPages((skip, limit) => fetchFacilitiesPage({ skip, limit }));
}

export async function createFacility(body: FacilityCreate) {
  const { data } = await api.post<{ item: Facility }>("/facilities", body);
  return data.item;
}

export type BulkCreateResult<T> = {
  items: T[];
  errors?: Array<{ index: number; message: string }>;
};

export async function createFacilitiesBulk(items: FacilityCreate[]) {
  const { data } = await api.post<BulkCreateResult<Facility>>("/facilities/bulk", { items });
  return data;
}

export async function updateFacility(id: string, body: Partial<FacilityCreate & { isActive: boolean }>) {
  const { data } = await api.patch<{ item: Facility }>(`/facilities/${id}`, body);
  return data.item;
}

export async function removeFacility(id: string) {
  await api.delete(`/facilities/${id}`);
}
