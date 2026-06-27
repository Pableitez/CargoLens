import { useRef, useState } from "react";
import { useDismissiblePopover } from "../../hooks/useDismissiblePopover";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import {
  getDiscreteVisibleOptions,
  isFacetOptionSelected,
  type FacetFilterState,
} from "../../utils/facetFilters";

type FilterSidebarDiscreteFilterProps = {
  columnId: string;
  options: string[];
  state: FacetFilterState;
  onSearchQueryChange: (value: string) => void;
  onToggleOption: (option: string) => void;
  onClearSelection: () => void;
};

export function FilterSidebarDiscreteFilter({
  columnId,
  options,
  state,
  onSearchQueryChange,
  onToggleOption,
  onClearSelection,
}: FilterSidebarDiscreteFilterProps) {
  const { t } = useAppTranslation();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const discreteOptions = getDiscreteVisibleOptions(options, state.searchQuery);
  const listId = `${columnId}-facet-options`;

  useDismissiblePopover(anchorRef, () => setPanelOpen(false), panelOpen);

  function openPanel() {
    setPanelOpen(true);
  }

  return (
    <div
      ref={anchorRef}
      className={`filter-sidebar__combo filter-sidebar__combo--discrete${panelOpen ? " filter-sidebar__combo--open" : ""}`}
    >
      <input
        type="search"
        className="filter-sidebar__input filter-sidebar__input--combo"
        value={state.searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        onFocus={openPanel}
        onClick={openPanel}
        placeholder={t("moduleList.discreteSearchPlaceholder")}
        autoComplete="off"
        role="combobox"
        aria-expanded={panelOpen}
        aria-controls={listId}
      />
      <button
        type="button"
        className="filter-sidebar__combo-toggle"
        onClick={() => setPanelOpen((open) => !open)}
        aria-expanded={panelOpen}
        aria-controls={listId}
        aria-label={t("moduleList.toggleOptions")}
      >
        ▾
      </button>

      {panelOpen && (
        <div id={listId} className="filter-sidebar__options-panel" role="listbox" aria-multiselectable="true">
          {discreteOptions.length === 0 ? (
            <p className="filter-sidebar__option-empty">{t("moduleList.noPickSuggestions")}</p>
          ) : (
            <ul className="filter-sidebar__option-checklist">
              {discreteOptions.map((option) => (
                <li key={option}>
                  <label className="filter-sidebar__option-check">
                    <input
                      type="checkbox"
                      checked={isFacetOptionSelected(state, option)}
                      onChange={() => onToggleOption(option)}
                    />
                    <span>{option}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {state.selectedOptions !== null && (
            <button
              type="button"
              className="filter-sidebar__link-btn filter-sidebar__link-btn--panel"
              onClick={onClearSelection}
            >
              {t("moduleList.clearSelection")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
