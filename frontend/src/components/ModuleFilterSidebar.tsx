import { useEffect, useId } from "react";
import { FilterSidebarColumnFilter } from "./FilterSidebarColumnFilter";
import { useAppTranslation } from "../i18n/useAppTranslation";
import type { ColumnFilterDef, FacetFilterState } from "../utils/facetFilters";

type ModuleFilterSidebarProps<T> = {
  open: boolean;
  onClose: () => void;
  columns: ColumnFilterDef<T>[];
  facets: Record<string, string[]>;
  filters: Record<string, FacetFilterState>;
  isColumnActive: (id: string) => boolean;
  onSearchQueryChange: (id: string, value: string) => void;
  onAddOption: (id: string, option: string) => void;
  onToggleOption: (id: string, option: string) => void;
  onRemoveOption: (id: string, option: string) => void;
  onClearOptionSelection: (id: string) => void;
  onClearAll: () => void;
  filteredCount: number;
  totalCount: number;
};

export function ModuleFilterSidebar<T>({
  open,
  onClose,
  columns,
  facets,
  filters,
  isColumnActive,
  onSearchQueryChange,
  onAddOption,
  onToggleOption,
  onRemoveOption,
  onClearOptionSelection,
  onClearAll,
  filteredCount,
  totalCount,
}: ModuleFilterSidebarProps<T>) {
  const { t } = useAppTranslation();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="filter-sidebar-backdrop" onClick={onClose} role="presentation">
      <aside
        className="filter-sidebar"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="filter-sidebar__head">
          <div>
            <h2 id={titleId} className="filter-sidebar__title">
              {t("moduleList.toggleFilters")}
            </h2>
            <p className="filter-sidebar__meta">
              {t("moduleList.resultCount", { filtered: filteredCount, total: totalCount })}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--icon filter-sidebar__close"
            onClick={onClose}
            aria-label={t("moduleList.closeSidebar")}
          >
            ×
          </button>
        </header>

        <div className="filter-sidebar__body">
          {columns.map((column) => {
            const state = filters[column.id];
            const options = facets[column.id] ?? [];

            return (
              <section
                key={column.id}
                className={`filter-sidebar__section${isColumnActive(column.id) ? " filter-sidebar__section--active" : ""}`}
              >
                <div className="filter-sidebar__section-head">
                  <h3 className="filter-sidebar__section-title">{column.label}</h3>
                  {isColumnActive(column.id) && (
                    <span className="filter-sidebar__section-badge">{t("moduleList.filterActive")}</span>
                  )}
                </div>

                <FilterSidebarColumnFilter
                  columnId={column.id}
                  filterKind={column.filterKind ?? "text"}
                  options={options}
                  state={state}
                  onSearchQueryChange={(value) => onSearchQueryChange(column.id, value)}
                  onAddOption={(option) => onAddOption(column.id, option)}
                  onToggleOption={(option) => onToggleOption(column.id, option)}
                  onRemoveOption={(option) => onRemoveOption(column.id, option)}
                  onClearSelection={() => onClearOptionSelection(column.id)}
                />
              </section>
            );
          })}
        </div>

        <footer className="filter-sidebar__foot">
          <button type="button" className="btn btn--ghost" onClick={onClearAll}>
            {t("moduleList.clearFilters")}
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {t("moduleList.applyFilters")}
          </button>
        </footer>
      </aside>
    </div>
  );
}
