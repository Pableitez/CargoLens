import type { ReactNode } from "react";
import { useAppTranslation } from "../i18n/useAppTranslation";
import type { ModuleListPageState } from "../hooks/useModuleListPage";
import { ModuleFilterSidebar } from "./ModuleFilterSidebar";
import { ModuleListToolbar } from "./ModuleListToolbar";
import type { ColumnFilterDef } from "../utils/facetFilters";

type ModuleListPageProps<T> = {
  headingId?: string;
  title?: string;
  panelClassName?: string;
  headerActions?: ReactNode;
  trailingActions?: ReactNode;
  lead?: ReactNode;
  loadingLabel: string;
  emptyTitle: string;
  emptyBody?: string;
  emptyActions?: ReactNode;
  searchPlaceholder?: string;
  tableColCount: number;
  tableHead: ReactNode;
  wideTable?: boolean;
  toolbarExtra?: ReactNode;
  filterColumns: ColumnFilterDef<T>[];
  list: ModuleListPageState<T>;
  children: (filteredItems: T[]) => ReactNode;
};

export function ModuleListPage<T>({
  headingId,
  title,
  panelClassName = "",
  headerActions,
  trailingActions,
  lead,
  loadingLabel,
  emptyTitle,
  emptyBody,
  emptyActions,
  searchPlaceholder,
  tableColCount,
  tableHead,
  wideTable = false,
  toolbarExtra,
  filterColumns,
  list,
  children,
}: ModuleListPageProps<T>) {
  const { t } = useAppTranslation();
  const {
    items,
    loading,
    error,
    showEmptyDataset,
    hasItems,
    filteredItems,
    activeFilterCount,
    activeFilterChips,
    globalSearch,
    setGlobalSearch,
    sidebarOpen,
    openSidebar,
    closeSidebar,
    filters,
    facets,
    isColumnActive,
    setSearchQuery,
    addOption,
    toggleOption,
    removeOption,
    clearOptionSelection,
    clearFilters,
    clearColumnFilterById,
  } = list;

  const toolbarActions = trailingActions ?? headerActions;
  const panelClass = ["panel", "panel--dash-form", wideTable ? "panel--module-list" : "", panelClassName]
    .filter(Boolean)
    .join(" ");
  const tableWrapClass = "dash-table-wrap dash-table-wrap--mt";

  return (
    <section className={panelClass} aria-labelledby={headingId}>
      {title ? (
        <div className="page-header-bar">
          <h2 id={headingId} className="page-header-bar__title">
            {title}
          </h2>
          {headerActions ? (
            <div className="dash-form__actions dash-form__actions--start">{headerActions}</div>
          ) : null}
        </div>
      ) : null}

      {lead}

      {!loading && hasItems && (
        <>
          <ModuleListToolbar
            onOpenFilters={openSidebar}
            sidebarOpen={sidebarOpen}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            filteredCount={filteredItems.length}
            totalCount={items.length}
            globalSearch={globalSearch}
            onGlobalSearchChange={setGlobalSearch}
            searchPlaceholder={searchPlaceholder}
            activeFilterChips={activeFilterChips}
            onClearColumnFilter={clearColumnFilterById}
            trailingActions={toolbarActions}
          >
            {toolbarExtra}
          </ModuleListToolbar>
          <ModuleFilterSidebar
            open={sidebarOpen}
            onClose={closeSidebar}
            columns={filterColumns}
            facets={facets}
            filters={filters}
            isColumnActive={isColumnActive}
            onSearchQueryChange={setSearchQuery}
            onAddOption={addOption}
            onToggleOption={toggleOption}
            onRemoveOption={removeOption}
            onClearOptionSelection={clearOptionSelection}
            onClearAll={clearFilters}
            filteredCount={filteredItems.length}
            totalCount={items.length}
          />
        </>
      )}

      {loading && <p className="panel__muted">{loadingLabel}</p>}
      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      {showEmptyDataset && (
        <div className="empty-state empty-state--compact empty-state--panel">
          <p className="empty-state__title">{emptyTitle}</p>
          {emptyBody ? <p className="empty-state__body">{emptyBody}</p> : null}
          {emptyActions ? <div className="empty-state__actions">{emptyActions}</div> : null}
        </div>
      )}

      {hasItems && (
        <div className={tableWrapClass}>
          <table className="dash-table">
            <thead>
              <tr>{tableHead}</tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={tableColCount} className="dash-table__empty">
                    {t("moduleList.noResults")}
                  </td>
                </tr>
              ) : (
                children(filteredItems)
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
