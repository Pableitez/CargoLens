export type ColumnFilterKind = "text" | "discrete" | "date";

export type ColumnFilterDef<T> = {
  id: string;
  label: string;
  getValue: (row: T) => string;
  /** Distinct option values per row; defaults to [getValue(row)] when omitted. */
  getFacetValues?: (row: T) => string[];
  /** ISO date key (YYYY-MM-DD) for calendar filters. Required when filterKind is "date". */
  getDateValue?: (row: T) => string;
  /** Discrete fields (status, mode…) show all options on click. Default: text. */
  filterKind?: ColumnFilterKind;
};

export type FacetFilterState = {
  /** Live text filter + query for value suggestions (single field). */
  searchQuery: string;
  /** null = no pinned values; non-empty = row must match at least one pinned value. */
  selectedOptions: string[] | null;
};

export function emptyFacetFilterState(): FacetFilterState {
  return { searchQuery: "", selectedOptions: null };
}

export function emptyFacetFilters(ids: string[]): Record<string, FacetFilterState> {
  return Object.fromEntries(ids.map((id) => [id, emptyFacetFilterState()]));
}

export function getRowFacetValues<T>(row: T, column: ColumnFilterDef<T>): string[] {
  const raw = column.getFacetValues ? column.getFacetValues(row) : [column.getValue(row)];
  return raw.map((value) => value.trim()).filter(Boolean);
}

export function buildFacetOptions<T>(items: T[], column: ColumnFilterDef<T>): string[] {
  const values = new Set<string>();
  for (const item of items) {
    for (const value of getRowFacetValues(item, column)) {
      values.add(value);
    }
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function isFacetFilterActive(state: FacetFilterState): boolean {
  if (state.searchQuery.trim().length > 0) return true;
  if (state.selectedOptions === null) return false;
  return state.selectedOptions.length > 0;
}

export function countActiveFacetFilters(filters: Record<string, FacetFilterState>): number {
  return Object.values(filters).filter(isFacetFilterActive).length;
}

export function rowMatchesFacetFilter<T>(
  row: T,
  column: ColumnFilterDef<T>,
  state: FacetFilterState
): boolean {
  if (column.filterKind === "date") {
    if (state.selectedOptions === null || state.selectedOptions.length === 0) return true;
    const rowDate = column.getDateValue?.(row) ?? "";
    if (!rowDate) return false;
    return state.selectedOptions.includes(rowDate);
  }

  const rowText = column.getValue(row).toLowerCase();
  const searchQuery = state.searchQuery.trim().toLowerCase();

  if (state.selectedOptions !== null) {
    if (state.selectedOptions.length === 0) return false;
    const selected = new Set(state.selectedOptions);
    const rowValues = getRowFacetValues(row, column);
    if (!rowValues.some((value) => selected.has(value))) return false;
  }

  if (searchQuery && !rowText.includes(searchQuery)) return false;

  return true;
}

export function filterByFacetFilters<T>(
  items: T[],
  filters: Record<string, FacetFilterState>,
  columns: ColumnFilterDef<T>[]
): T[] {
  const activeColumns = columns.filter((column) =>
    isFacetFilterActive(filters[column.id] ?? emptyFacetFilterState())
  );
  if (activeColumns.length === 0) return items;

  return items.filter((item) =>
    activeColumns.every((column) =>
      rowMatchesFacetFilter(item, column, filters[column.id] ?? emptyFacetFilterState())
    )
  );
}

export const FACET_SUGGESTION_LIMIT = 8;

export function getDisplayedSelectedOptions(state: FacetFilterState): string[] {
  if (state.selectedOptions === null) return [];
  return state.selectedOptions;
}

export function getFacetSelectionSummary(
  state: FacetFilterState,
  totalOptions: number
): {
  selectedCount: number;
  totalOptions: number;
  restrictsOptions: boolean;
} {
  if (state.selectedOptions === null) {
    return { selectedCount: totalOptions, totalOptions, restrictsOptions: false };
  }
  return {
    selectedCount: state.selectedOptions.length,
    totalOptions,
    restrictsOptions: true,
  };
}

export function isFacetOptionSelected(state: FacetFilterState, option: string): boolean {
  if (state.selectedOptions === null) return false;
  return state.selectedOptions.includes(option);
}

export function toggleFacetOption(
  state: FacetFilterState,
  option: string,
  allOptions: string[]
): FacetFilterState {
  if (allOptions.length === 0) return state;

  if (state.selectedOptions === null) {
    return { ...state, selectedOptions: [option] };
  }

  const selected = new Set(state.selectedOptions);
  if (selected.has(option)) selected.delete(option);
  else selected.add(option);

  const next = allOptions.filter((value) => selected.has(value));
  if (next.length === 0 || next.length === allOptions.length) {
    return { ...state, selectedOptions: null };
  }
  return { ...state, selectedOptions: next };
}

export function getDiscreteVisibleOptions(options: string[], searchQuery: string): string[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return options;
  return options.filter((option) => option.toLowerCase().includes(query));
}

export function getFacetOptionSuggestions(
  options: string[],
  searchQuery: string,
  selectedOptions: string[] | null,
  limit = FACET_SUGGESTION_LIMIT
): string[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return [];

  const selectedSet = selectedOptions === null ? new Set<string>() : new Set(selectedOptions);

  return options
    .filter((option) => option.toLowerCase().includes(query))
    .filter((option) => !selectedSet.has(option))
    .slice(0, limit);
}

export function countFacetOptionMatches(
  options: string[],
  searchQuery: string,
  selectedOptions: string[] | null
): number {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return 0;

  const selectedSet = selectedOptions === null ? new Set<string>() : new Set(selectedOptions);
  return options.filter((option) => option.toLowerCase().includes(query) && !selectedSet.has(option)).length;
}

export function addFacetOption(
  state: FacetFilterState,
  option: string,
  allOptions: string[],
  { allowSelectAllReset = true }: { allowSelectAllReset?: boolean } = {}
): FacetFilterState {
  if (state.selectedOptions === null) {
    return { ...state, selectedOptions: [option], searchQuery: "" };
  }
  if (state.selectedOptions.includes(option)) {
    return { ...state, searchQuery: "" };
  }
  const next = [...state.selectedOptions, option];
  if (allowSelectAllReset && allOptions.length > 0 && next.length >= allOptions.length) {
    return { ...state, selectedOptions: null, searchQuery: "" };
  }
  return { ...state, selectedOptions: next, searchQuery: "" };
}

export function addDateFacetOption(state: FacetFilterState, option: string): FacetFilterState {
  const isoDate = option.trim();
  if (!isoDate) return state;
  if (state.selectedOptions === null) {
    return { ...state, selectedOptions: [isoDate], searchQuery: "" };
  }
  if (state.selectedOptions.includes(isoDate)) {
    return { ...state, searchQuery: "" };
  }
  return { ...state, selectedOptions: [...state.selectedOptions, isoDate], searchQuery: "" };
}

export function removeFacetOption(
  state: FacetFilterState,
  option: string,
  allOptions: string[]
): FacetFilterState {
  if (state.selectedOptions === null) {
    const next = allOptions.filter((value) => value !== option);
    return { ...state, selectedOptions: next.length === 0 ? [] : next };
  }
  const next = state.selectedOptions.filter((value) => value !== option);
  if (next.length === 0) {
    return { ...state, selectedOptions: null };
  }
  return { ...state, selectedOptions: next };
}

export function clearFacetOptionSelection(state: FacetFilterState): FacetFilterState {
  return { ...state, selectedOptions: null };
}

export function clearColumnFilter(state: FacetFilterState): FacetFilterState {
  return emptyFacetFilterState();
}

export type ActiveFilterChip = {
  columnId: string;
  columnLabel: string;
  summary: string;
};

export function rowMatchesGlobalSearch<T>(row: T, columns: ColumnFilterDef<T>[], query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return columns.some((column) => {
    if (column.getValue(row).toLowerCase().includes(normalized)) return true;
    return getRowFacetValues(row, column).some((value) => value.toLowerCase().includes(normalized));
  });
}

export function filterByGlobalSearch<T>(items: T[], columns: ColumnFilterDef<T>[], query: string): T[] {
  const normalized = query.trim();
  if (!normalized) return items;
  return items.filter((item) => rowMatchesGlobalSearch(item, columns, normalized));
}

export function getActiveFilterChips<T>(
  columns: ColumnFilterDef<T>[],
  filters: Record<string, FacetFilterState>,
  formatDateLabel: (isoDate: string) => string = (value) => value
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  for (const column of columns) {
    const state = filters[column.id] ?? emptyFacetFilterState();
    if (!isFacetFilterActive(state)) continue;

    const parts: string[] = [];
    if (state.selectedOptions?.length) {
      const values =
        column.filterKind === "date"
          ? state.selectedOptions.map((value) => formatDateLabel(value))
          : state.selectedOptions;
      parts.push(...values);
    }
    if (state.searchQuery.trim()) {
      parts.push(`"${state.searchQuery.trim()}"`);
    }

    chips.push({
      columnId: column.id,
      columnLabel: column.label,
      summary: parts.join(", "),
    });
  }

  return chips;
}
