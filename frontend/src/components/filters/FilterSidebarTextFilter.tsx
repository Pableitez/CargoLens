import { useAppTranslation } from "../../i18n/useAppTranslation";
import {
  getDisplayedSelectedOptions,
  getFacetOptionSuggestions,
  type FacetFilterState,
} from "../../utils/facetFilters";

type FilterSidebarTextFilterProps = {
  state: FacetFilterState;
  options: string[];
  onSearchQueryChange: (value: string) => void;
  onAddOption: (option: string) => void;
  onRemoveOption: (option: string) => void;
  onClearSelection: () => void;
};

export function FilterSidebarTextFilter({
  state,
  options,
  onSearchQueryChange,
  onAddOption,
  onRemoveOption,
  onClearSelection,
}: FilterSidebarTextFilterProps) {
  const { t } = useAppTranslation();
  const selectedChips = getDisplayedSelectedOptions(state);
  const suggestions = getFacetOptionSuggestions(options, state.searchQuery, state.selectedOptions);
  const hasQuery = state.searchQuery.trim().length > 0;

  return (
    <>
      {selectedChips.length > 0 && (
        <div className="filter-sidebar__chips" aria-label={t("moduleList.selectedValues")}>
          {selectedChips.map((option) => (
            <span key={option} className="filter-sidebar__chip">
              <span className="filter-sidebar__chip-text">{option}</span>
              <button
                type="button"
                className="filter-sidebar__chip-remove"
                onClick={() => onRemoveOption(option)}
                aria-label={t("moduleList.removeValue", { value: option })}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className="filter-sidebar__link-btn filter-sidebar__link-btn--inline"
            onClick={onClearSelection}
          >
            {t("moduleList.clearSelection")}
          </button>
        </div>
      )}

      <input
        type="search"
        className="filter-sidebar__input filter-sidebar__input--combo"
        value={state.searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder={t("moduleList.unifiedSearchPlaceholder")}
        autoComplete="off"
      />

      {hasQuery && suggestions.length > 0 && (
        <ul className="filter-sidebar__suggestions" role="listbox">
          {suggestions.map((option) => (
            <li key={option} role="presentation">
              <button
                type="button"
                className="filter-sidebar__suggestion"
                role="option"
                onClick={() => onAddOption(option)}
              >
                <span className="filter-sidebar__suggestion-add" aria-hidden="true">
                  +
                </span>
                <span className="filter-sidebar__suggestion-text">{option}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
