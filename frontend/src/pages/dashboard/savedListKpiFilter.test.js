import { describe, expect, it } from "vitest";
import { filterSavedListByKpi } from "./savedListKpiFilter.js";

const rows = [
  { id: "1", clientId: "c1", entrySource: "manual" },
  { id: "2", clientId: null, entrySource: "import" },
  { id: "3", clientId: "c2", entrySource: "seed" },
  { id: "4", clientId: null, entrySource: "api" },
];

describe("filterSavedListByKpi", () => {
  it("sin filtros devuelve la misma lista", () => {
    expect(filterSavedListByKpi(rows, null, null)).toEqual(rows);
  });

  it("filtra por scope assigned/unassigned", () => {
    expect(filterSavedListByKpi(rows, "assigned", null).every((r) => r.clientId)).toBe(true);
    expect(filterSavedListByKpi(rows, "unassigned", null).every((r) => !r.clientId)).toBe(true);
  });

  it("filtra por source", () => {
    expect(filterSavedListByKpi(rows, null, "manual")).toHaveLength(1);
    expect(filterSavedListByKpi(rows, null, "import")).toHaveLength(1);
    expect(filterSavedListByKpi(rows, null, "seed")).toHaveLength(1);
    expect(filterSavedListByKpi(rows, null, "api")).toHaveLength(1);
  });

  it("combina scope y source", () => {
    const only = filterSavedListByKpi(rows, "assigned", "manual");
    expect(only).toHaveLength(1);
    expect(only[0].id).toBe("1");
  });
});
