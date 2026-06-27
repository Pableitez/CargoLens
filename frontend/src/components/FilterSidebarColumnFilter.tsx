import { FilterSidebarDateFilter } from "./filters/FilterSidebarDateFilter";
import { FilterSidebarDiscreteFilter } from "./filters/FilterSidebarDiscreteFilter";
import { FilterSidebarTextFilter } from "./filters/FilterSidebarTextFilter";
import type { ColumnFilterKind, FacetFilterState } from "../utils/facetFilters";

type FilterSidebarColumnFilterProps = {
  columnId: string;
  filterKind: ColumnFilterKind;
  options: string[];
  state: FacetFilterState;
  onSearchQueryChange: (value: string) => void;
  onAddOption: (option: string) => void;
  onToggleOption: (option: string) => void;
  onRemoveOption: (option: string) => void;
  onClearSelection: () => void;
};

export function FilterSidebarColumnFilter({
  columnId,
  filterKind,
  options,
  state,
  onSearchQueryChange,
  onAddOption,
  onToggleOption,
  onRemoveOption,
  onClearSelection,
}: FilterSidebarColumnFilterProps) {
  if (filterKind === "date") {
    return (
      <FilterSidebarDateFilter
        state={state}
        onAddOption={onAddOption}
        onRemoveOption={onRemoveOption}
        onClearSelection={onClearSelection}
      />
    );
  }

  const isDiscrete = filterKind === "discrete" && options.length > 0;

  return (
    <div className="filter-sidebar__column-filter">
      {isDiscrete ? (
        <FilterSidebarDiscreteFilter
          columnId={columnId}
          options={options}
          state={state}
          onSearchQueryChange={onSearchQueryChange}
          onToggleOption={onToggleOption}
          onClearSelection={onClearSelection}
        />
      ) : (
        <FilterSidebarTextFilter
          state={state}
          options={options}
          onSearchQueryChange={onSearchQueryChange}
          onAddOption={onAddOption}
          onRemoveOption={onRemoveOption}
          onClearSelection={onClearSelection}
        />
      )}
    </div>
  );
}
