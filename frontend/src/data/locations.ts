import catalog from "@shared/location-catalog.json";

export type LocationKind = "port" | "inland" | "airport";

export type LocationRecord = {
  code: string;
  name: string;
  country: string;
  kind: LocationKind;
};

/** Curated UN/LOCODE catalog shared with the backend (`shared/location-catalog.json`). */
export const LOCATION_CATALOG = catalog as LocationRecord[];
