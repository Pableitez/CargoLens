import type { ReactNode } from "react";
import { useAppTranslation } from "../i18n/useAppTranslation";
import type { ActiveFilterChip } from "../utils/facetFilters";

type ModuleListToolbarProps = {
  onOpenFilters: () => void;
  sidebarOpen?: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  globalSearch: string;
  onGlobalSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  activeFilterChips?: ActiveFilterChip[];
  onClearColumnFilter?: (columnId: string) => void;
  children?: ReactNode;
  trailingActions?: ReactNode;
};

function FilterIcon() {
  return (
    <svg
      className="module-list-toolbar__filters-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 3.5h12M4.5 8h7M6.5 12.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="module-list-toolbar__search-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ModuleListToolbar({
  onOpenFilters,
  sidebarOpen = false,
  activeFilterCount,
  onClearFilters,
  filteredCount,
  totalCount,
  globalSearch,
  onGlobalSearchChange,
  searchPlaceholder,
  activeFilterChips = [],
  onClearColumnFilter,
  children,
  trailingActions,
}: ModuleListToolbarProps) {
  const { t } = useAppTranslation();
  const columnFiltersActive = activeFilterCount > 0;
  const globalSearchActive = globalSearch.trim().length > 0;
  const filtersActive = columnFiltersActive || globalSearchActive;
  const showResultCount = totalCount > 0;
  const resultDiffers = filteredCount !== totalCount;
  const hasToolbarFilters = filtersActive || activeFilterChips.length > 0;
  const showFilteredCount = showResultCount && hasToolbarFilters;
  const countLabel = resultDiffers
    ? t("moduleList.resultCount", { filtered: filteredCount, total: totalCount })
    : t("moduleList.totalCount", { total: totalCount });

  return (
    <div className="module-list-toolbar">
      <div className="module-list-toolbar__main">
        <label className="module-list-toolbar__search">
          <span className="sr-only">{t("moduleList.searchLabel")}</span>
          <SearchIcon />
          <input
            type="search"
            className="module-list-toolbar__search-input"
            value={globalSearch}
            onChange={(event) => onGlobalSearchChange(event.target.value)}
            placeholder={searchPlaceholder ?? t("moduleList.globalSearchPlaceholder")}
            autoComplete="off"
          />
        </label>

        <div className="module-list-toolbar__actions-group">
          <button
            type="button"
            className={`btn btn--secondary btn--sm module-list-toolbar__filters-btn${sidebarOpen ? " module-list-toolbar__filters-btn--open" : ""}`}
            onClick={onOpenFilters}
            aria-expanded={sidebarOpen}
          >
            <FilterIcon />
            {t("moduleList.toggleFilters")}
            {columnFiltersActive && (
              <span
                className="module-list-toolbar__badge"
                aria-label={t("moduleList.activeFilters", { count: activeFilterCount })}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {filtersActive && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onClearFilters}>
              {t("moduleList.clearFilters")}
            </button>
          )}
        </div>

        {trailingActions ? <div className="module-list-toolbar__trailing">{trailingActions}</div> : null}
      </div>

      {(activeFilterChips.length > 0 || children || showFilteredCount) && (
        <div className="module-list-toolbar__secondary">
          {activeFilterChips.length > 0 && (
            <div className="module-list-toolbar__chips" aria-label={t("moduleList.activeFilterChips")}>
              {activeFilterChips.map((chip) => (
                <span key={chip.columnId} className="module-list-toolbar__chip">
                  <span className="module-list-toolbar__chip-label">{chip.columnLabel}</span>
                  <span className="module-list-toolbar__chip-value">{chip.summary}</span>
                  {onClearColumnFilter && (
                    <button
                      type="button"
                      className="module-list-toolbar__chip-remove"
                      onClick={() => onClearColumnFilter(chip.columnId)}
                      aria-label={t("moduleList.removeColumnFilter", {
                        column: chip.columnLabel,
                        value: chip.summary,
                      })}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          {children}
          {showFilteredCount ? (
            <p
              className={`module-list-toolbar__results module-list-toolbar__results--secondary${resultDiffers ? " module-list-toolbar__results--filtered" : ""}`}
            >
              {countLabel}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
