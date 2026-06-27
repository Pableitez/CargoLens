declare module "@shared/location-catalog.json" {
  export type SharedLocationCatalogEntry = {
    code: string;
    name: string;
    country: string;
    kind: string;
  };
  const value: SharedLocationCatalogEntry[];
  export default value;
}
