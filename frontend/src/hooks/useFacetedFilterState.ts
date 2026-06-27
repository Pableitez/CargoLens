import { useCallback, useMemo, useState } from "react";
import {
  addDateFacetOption,
  addFacetOption,
  buildFacetOptions,
  clearColumnFilter,
  clearFacetOptionSelection,
  countActiveFacetFilters,
  emptyFacetFilterState,
  emptyFacetFilters,
  filterByFacetFilters,
  filterByGlobalSearch,
  getActiveFilterChips,
  isFacetFilterActive,
  removeFacetOption,
  toggleFacetOption,
  type ColumnFilterDef,
} from "../utils/facetFilters";
import { formatFilterDateLabel } from "../utils/dateFilter";
import { useDebouncedValue } from "./useDebouncedValue";

export function useFacetedFilterState<T>(columns: ColumnFilterDef<T>[], items: T[]) {
  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);
  const [filters, setFilters] = useState(() => emptyFacetFilters(columnIds));
  const [globalSearch, setGlobalSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const debouncedFilters = useDebouncedValue(filters, 200);
  const debouncedGlobalSearch = useDebouncedValue(globalSearch, 200);

  const facets = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.id, buildFacetOptions(items, column)])),
    [items, columns]
  );

  const globallyFilteredItems = useMemo(
    () => filterByGlobalSearch(items, columns, debouncedGlobalSearch),
    [items, columns, debouncedGlobalSearch]
  );

  const filteredItems = useMemo(
    () => filterByFacetFilters(globallyFilteredItems, debouncedFilters, columns),
    [globallyFilteredItems, debouncedFilters, columns]
  );

  const activeFilterCount = countActiveFacetFilters(filters);
  const filtersActive = activeFilterCount > 0 || globalSearch.trim().length > 0;

  const activeFilterChips = useMemo(
    () => getActiveFilterChips(columns, filters, formatFilterDateLabel),
    [columns, filters]
  );

  const setSearchQuery = useCallback((id: string, searchQuery: string) => {
    setFilters((prev) => ({
      ...prev,
      [id]: { ...prev[id], searchQuery },
    }));
  }, []);

  const addOption = useCallback(
    (id: string, option: string) => {
      const column = columns.find((entry) => entry.id === id);
      setFilters((prev) => ({
        ...prev,
        [id]:
          column?.filterKind === "date"
            ? addDateFacetOption(prev[id], option)
            : addFacetOption(prev[id], option, facets[id] ?? []),
      }));
    },
    [facets, columns]
  );

  const toggleOption = useCallback(
    (id: string, option: string) => {
      setFilters((prev) => ({
        ...prev,
        [id]: toggleFacetOption(prev[id], option, facets[id] ?? []),
      }));
    },
    [facets]
  );

  const removeOption = useCallback(
    (id: string, option: string) => {
      setFilters((prev) => ({
        ...prev,
        [id]: removeFacetOption(prev[id], option, facets[id] ?? []),
      }));
    },
    [facets]
  );

  const clearOptionSelection = useCallback((id: string) => {
    setFilters((prev) => ({
      ...prev,
      [id]: clearFacetOptionSelection(prev[id]),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyFacetFilters(columnIds));
    setGlobalSearch("");
  }, [columnIds]);

  const clearColumnFilterById = useCallback((id: string) => {
    setFilters((prev) => ({
      ...prev,
      [id]: clearColumnFilter(prev[id] ?? emptyFacetFilterState()),
    }));
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const isColumnActive = useCallback(
    (id: string) => isFacetFilterActive(filters[id] ?? emptyFacetFilterState()),
    [filters]
  );

  return {
    filters,
    facets,
    filteredItems,
    filtersActive,
    activeFilterCount,
    activeFilterChips,
    globalSearch,
    setGlobalSearch,
    sidebarOpen,
    openSidebar,
    closeSidebar,
    setSearchQuery,
    addOption,
    toggleOption,
    removeOption,
    clearOptionSelection,
    clearFilters,
    clearColumnFilterById,
    isColumnActive,
  };
}
