import { describe, expect, it } from "vitest";
import {
  addDateFacetOption,
  addFacetOption,
  emptyFacetFilterState,
  filterByFacetFilters,
  filterByGlobalSearch,
  getActiveFilterChips,
  isFacetFilterActive,
  rowMatchesFacetFilter,
  type ColumnFilterDef,
} from "./facetFilters";

type Row = { id: string; date: string | null; label: string };

const dateColumn: ColumnFilterDef<Row> = {
  id: "date",
  label: "Date",
  getValue: (row) => row.date ?? "",
  getDateValue: (row) => row.date ?? "",
  filterKind: "date",
};

describe("isFacetFilterActive", () => {
  it("treats empty selectedOptions as inactive", () => {
    expect(isFacetFilterActive({ searchQuery: "", selectedOptions: [] })).toBe(false);
  });

  it("treats selected dates as active", () => {
    expect(isFacetFilterActive({ searchQuery: "", selectedOptions: ["2026-06-01"] })).toBe(true);
  });
});

describe("addDateFacetOption", () => {
  it("accumulates multiple dates without clearing when all options are selected", () => {
    const allDates = ["2026-06-01", "2026-06-02"];
    let state = emptyFacetFilterState();
    state = addDateFacetOption(state, allDates[0]);
    state = addDateFacetOption(state, allDates[1]);
    expect(state.selectedOptions).toEqual(allDates);
  });

  it("does not reset when addFacetOption would clear on select-all", () => {
    const allOptions = ["2026-06-01", "2026-06-02"];
    let state = addFacetOption(emptyFacetFilterState(), allOptions[0], allOptions);
    state = addFacetOption(state, allOptions[1], allOptions);
    expect(state.selectedOptions).toBeNull();
  });
});

describe("rowMatchesFacetFilter date", () => {
  const rows: Row[] = [
    { id: "1", date: "2026-06-01", label: "A" },
    { id: "2", date: "2026-06-02", label: "B" },
    { id: "3", date: null, label: "C" },
  ];

  it("matches any selected date", () => {
    const state = { searchQuery: "", selectedOptions: ["2026-06-01", "2026-06-02"] };
    expect(rowMatchesFacetFilter(rows[0], dateColumn, state)).toBe(true);
    expect(rowMatchesFacetFilter(rows[1], dateColumn, state)).toBe(true);
    expect(rowMatchesFacetFilter(rows[2], dateColumn, state)).toBe(false);
  });

  it("filters rows by selected dates", () => {
    const filters = { date: { searchQuery: "", selectedOptions: ["2026-06-02"] } };
    const result = filterByFacetFilters(rows, filters, [dateColumn]);
    expect(result.map((row) => row.id)).toEqual(["2"]);
  });
});

describe("filterByGlobalSearch", () => {
  const textColumn: ColumnFilterDef<Row> = {
    id: "label",
    label: "Label",
    getValue: (row) => row.label,
  };

  const rows: Row[] = [
    { id: "1", date: "2026-06-01", label: "Alpha Corp" },
    { id: "2", date: "2026-06-02", label: "Beta Ltd" },
  ];

  it("returns all rows when query is empty", () => {
    expect(filterByGlobalSearch(rows, [textColumn], "")).toHaveLength(2);
  });

  it("matches any column value case-insensitively", () => {
    const result = filterByGlobalSearch(rows, [textColumn], "beta");
    expect(result.map((row) => row.id)).toEqual(["2"]);
  });
});

describe("getActiveFilterChips", () => {
  it("summarizes active column filters", () => {
    const column: ColumnFilterDef<Row> = {
      id: "label",
      label: "Label",
      getValue: (row) => row.label,
    };
    const filters = {
      label: { searchQuery: "acme", selectedOptions: ["Open"] as string[] },
    };
    const chips = getActiveFilterChips([column], filters);
    expect(chips).toEqual([{ columnId: "label", columnLabel: "Label", summary: 'Open, "acme"' }]);
  });
});
