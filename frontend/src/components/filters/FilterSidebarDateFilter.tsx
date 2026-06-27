import { useState } from "react";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { formatFilterDateLabel } from "../../utils/dateFilter";
import type { FacetFilterState } from "../../utils/facetFilters";

type FilterSidebarDateFilterProps = {
  state: FacetFilterState;
  onAddOption: (option: string) => void;
  onRemoveOption: (option: string) => void;
  onClearSelection: () => void;
};

export function FilterSidebarDateFilter({
  state,
  onAddOption,
  onRemoveOption,
  onClearSelection,
}: FilterSidebarDateFilterProps) {
  const { t } = useAppTranslation();
  const [pickerValue, setPickerValue] = useState("");
  const selectedDates = state.selectedOptions ?? [];

  function handleDateChange(value: string) {
    setPickerValue(value);
    if (value) {
      onAddOption(value);
      setPickerValue("");
    }
  }

  return (
    <div className="filter-sidebar__column-filter filter-sidebar__column-filter--date">
      {selectedDates.length > 0 && (
        <div className="filter-sidebar__chips" aria-label={t("moduleList.selectedValues")}>
          {selectedDates.map((option) => (
            <span key={option} className="filter-sidebar__chip">
              <span className="filter-sidebar__chip-text">{formatFilterDateLabel(option)}</span>
              <button
                type="button"
                className="filter-sidebar__chip-remove"
                onClick={() => onRemoveOption(option)}
                aria-label={t("moduleList.removeValue", { value: formatFilterDateLabel(option) })}
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
        type="date"
        className="filter-sidebar__input filter-sidebar__input--date"
        value={pickerValue}
        onChange={(event) => handleDateChange(event.target.value)}
        aria-label={t("moduleList.dateFilterLabel")}
      />
    </div>
  );
}
