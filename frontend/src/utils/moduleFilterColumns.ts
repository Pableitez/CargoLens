import type { ColumnFilterDef } from "./facetFilters";
import { toFilterDateKey } from "./dateFilter";
import { locationFacetValue, locationSearchText } from "./locationUtils";

export function buildLocationFilterColumn<T>(
  id: string,
  label: string,
  getCode: (row: T) => string
): ColumnFilterDef<T> {
  return {
    id,
    label,
    getValue: (row) => locationSearchText(getCode(row)),
    getFacetValues: (row) => locationFacetValue(getCode(row)),
    filterKind: "discrete",
  };
}

export function buildDateFilterColumn<T>(
  id: string,
  label: string,
  getRawDate: (row: T) => string | null,
  formatDate: (value: string | null) => string
): ColumnFilterDef<T> {
  return {
    id,
    label,
    getValue: (row) => formatDate(getRawDate(row)),
    getDateValue: (row) => toFilterDateKey(getRawDate(row)),
    getFacetValues: (row) => {
      const key = toFilterDateKey(getRawDate(row));
      return key ? [key] : [];
    },
    filterKind: "date",
  };
}

export function buildTextFilterColumn<T>(
  id: string,
  label: string,
  getValue: (row: T) => string,
  getFacetValues?: (row: T) => string[]
): ColumnFilterDef<T> {
  return {
    id,
    label,
    getValue,
    getFacetValues,
    filterKind: "text",
  };
}

export function buildDiscreteFilterColumn<T>(
  id: string,
  label: string,
  getValue: (row: T) => string,
  getFacetValues?: (row: T) => string[]
): ColumnFilterDef<T> {
  return {
    id,
    label,
    getValue,
    getFacetValues,
    filterKind: "discrete",
  };
}

export function buildPartyFilterColumns<T>(labels: {
  customer: string;
  shipper: string;
  consignee: string;
  getCustomer: (row: T) => string;
  getShipper: (row: T) => string;
  getConsignee: (row: T) => string;
}): ColumnFilterDef<T>[] {
  return [
    {
      id: "customer",
      label: labels.customer,
      getValue: (row) =>
        [labels.getCustomer(row), labels.getShipper(row), labels.getConsignee(row)].join(" "),
      getFacetValues: (row) =>
        [labels.getCustomer(row), labels.getShipper(row), labels.getConsignee(row)].filter(Boolean),
    },
    {
      id: "shipper",
      label: labels.shipper,
      getValue: (row) => labels.getShipper(row),
      getFacetValues: (row) => (labels.getShipper(row) ? [labels.getShipper(row)] : []),
    },
    {
      id: "consignee",
      label: labels.consignee,
      getValue: (row) => labels.getConsignee(row),
      getFacetValues: (row) => (labels.getConsignee(row) ? [labels.getConsignee(row)] : []),
    },
  ];
}

export function buildRouteLocationFilterColumns<T>(labels: {
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  getPlaceOfReceipt: (row: T) => string;
  getPortOfLoading: (row: T) => string;
  getPortOfDischarge: (row: T) => string;
  getPlaceOfDelivery: (row: T) => string;
}): ColumnFilterDef<T>[] {
  return [
    buildLocationFilterColumn("placeOfReceipt", labels.placeOfReceipt, labels.getPlaceOfReceipt),
    buildLocationFilterColumn("portOfLoading", labels.portOfLoading, labels.getPortOfLoading),
    buildLocationFilterColumn("portOfDischarge", labels.portOfDischarge, labels.getPortOfDischarge),
    buildLocationFilterColumn("placeOfDelivery", labels.placeOfDelivery, labels.getPlaceOfDelivery),
  ];
}
