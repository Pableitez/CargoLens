import type { ColumnFilterDef } from "../utils/facetFilters";
import { useFacetedFilterState } from "./useFacetedFilterState";
import { useModuleListQuery, type ModuleListQueryState } from "./useModuleListQuery";

export function useModuleListPage<T>(
  fetchItems: () => Promise<T[]>,
  loadFailedKey: string,
  filterColumns: ColumnFilterDef<T>[]
) {
  const query = useModuleListQuery(fetchItems, loadFailedKey);
  const filters = useFacetedFilterState(filterColumns, query.items);

  return {
    ...query,
    ...filters,
    filterColumns,
  };
}

export type ModuleListPageState<T> = ModuleListQueryState<T> &
  ReturnType<typeof useFacetedFilterState<T>> & {
    filterColumns: ColumnFilterDef<T>[];
  };
