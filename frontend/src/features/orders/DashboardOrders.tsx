import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as ordersApi from "../../api/orders";
import { LocationCell } from "../../components/LocationCombobox";
import { ModuleListPage } from "../../components/ModuleListPage";
import { useModuleListPage } from "../../hooks/useModuleListPage";
import { useAppToast } from "../../hooks/useAppToast";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import type { ColumnFilterDef } from "../../utils/facetFilters";
import {
  buildDateFilterColumn,
  buildDiscreteFilterColumn,
  buildPartyFilterColumns,
  buildRouteLocationFilterColumns,
  buildTextFilterColumn,
} from "../../utils/moduleFilterColumns";
import { canSelectOrderForBooking, normalizeCustomerKey } from "./orderListUtils";
import { formatOrderDate, orderStatusClass, orderStatusLabel, transportModeLabel } from "./orderUtils";
import type { Order } from "./types";

const ORDER_BASE = "/dashboard/operations/export/order";
const BOOKING_BASE = "/dashboard/operations/export/shipper-booking";
const ORDER_TABLE_COL_COUNT = 13;

function formatOrderField(value: string): string {
  return value.trim() || "—";
}

export function DashboardOrders() {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(() => ordersApi.fetchOrders(), []);

  const filterColumns = useMemo<ColumnFilterDef<Order>[]>(
    () => [
      buildTextFilterColumn(
        "orderNumber",
        t("ordersPage.thOrderNumber"),
        (row) => [row.orderNumber, row.externalBusinessId].join(" "),
        (row) => [row.orderNumber]
      ),
      ...buildPartyFilterColumns<Order>({
        customer: t("tradeField.contractualCustomer"),
        shipper: t("tradeField.shipper"),
        consignee: t("tradeField.consignee"),
        getCustomer: (row) => row.customer,
        getShipper: (row) => row.shipper,
        getConsignee: (row) => row.consignee,
      }),
      ...buildRouteLocationFilterColumns<Order>({
        placeOfReceipt: t("ordersPage.placeOfReceiptLabel"),
        portOfLoading: t("ordersPage.portOfLoadingLabel"),
        portOfDischarge: t("ordersPage.portOfDischargeLabel"),
        placeOfDelivery: t("ordersPage.placeOfDeliveryLabel"),
        getPlaceOfReceipt: (row) => row.placeOfReceipt,
        getPortOfLoading: (row) => row.portOfLoading,
        getPortOfDischarge: (row) => row.portOfDischarge,
        getPlaceOfDelivery: (row) => row.placeOfDelivery,
      }),
      buildDateFilterColumn(
        "shippingWindowStart",
        t("ordersPage.windowStartLabel"),
        (row) => row.shippingWindowStart,
        formatOrderDate
      ),
      buildDateFilterColumn(
        "shippingWindowEnd",
        t("ordersPage.windowEndLabel"),
        (row) => row.shippingWindowEnd,
        formatOrderDate
      ),
      buildDiscreteFilterColumn(
        "incoterm",
        t("ordersPage.incotermLabel"),
        (row) => row.incoterm || "—",
        (row) => (row.incoterm ? [row.incoterm] : [])
      ),
      buildDiscreteFilterColumn("transport", t("ordersPage.thTransport"), (row) =>
        transportModeLabel(row.transportMode, t)
      ),
      buildDiscreteFilterColumn("status", t("ordersPage.thStatus"), (row) => orderStatusLabel(row.status, t)),
      buildTextFilterColumn(
        "lines",
        t("ordersPage.thLines"),
        (row) =>
          [String(row.lines.length), ...row.lines.map((line) => `${line.lineKey} ${line.sku}`)].join(" "),
        (row) => [String(row.lines.length), ...row.lines.map((line) => line.sku).filter(Boolean)]
      ),
    ],
    [t]
  );

  const list = useModuleListPage(fetchItems, "ordersPage.loadFailed", filterColumns);

  const selectedCustomerKey = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const firstSelected = list.items.find((order) => selectedIds.has(order.id));
    return firstSelected ? normalizeCustomerKey(firstSelected.customer) : null;
  }, [list.items, selectedIds]);

  const lockedCustomerLabel = useMemo(() => {
    if (!selectedCustomerKey) return "";
    const match = list.items.find((order) => normalizeCustomerKey(order.customer) === selectedCustomerKey);
    return match?.customer ?? "";
  }, [list.items, selectedCustomerKey]);

  const visibleSelectable = useMemo(
    () => list.filteredItems.filter((order) => canSelectOrderForBooking(order, selectedCustomerKey)),
    [list.filteredItems, selectedCustomerKey]
  );

  const allVisibleSelected =
    visibleSelectable.length > 0 && visibleSelectable.every((order) => selectedIds.has(order.id));

  function toggleOrderSelection(order: Order) {
    if (!canSelectOrderForBooking(order, selectedCustomerKey)) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(order.id)) next.delete(order.id);
      else next.add(order.id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const order of visibleSelectable) next.delete(order.id);
        return next;
      });
      return;
    }

    const anchorCustomer = selectedCustomerKey ?? normalizeCustomerKey(visibleSelectable[0]?.customer ?? "");
    const toSelect = visibleSelectable.filter(
      (order) => normalizeCustomerKey(order.customer) === anchorCustomer
    );

    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const order of toSelect) next.add(order.id);
      return next;
    });
  }

  function handleBookSelected() {
    const selectedOrders = list.items.filter((order) => selectedIds.has(order.id));
    if (selectedOrders.length === 0) return;

    const customerKeys = new Set(selectedOrders.map((order) => normalizeCustomerKey(order.customer)));
    if (customerKeys.size > 1) {
      showToast({ message: t("ordersPage.sameCustomerRequired"), variant: "error" });
      return;
    }

    navigate(`${BOOKING_BASE}/new`, {
      state: { fromOrderNumbers: selectedOrders.map((order) => order.orderNumber) },
    });
  }

  return (
    <ModuleListPage
      headingId="orders-heading"
      wideTable
      loadingLabel={t("ordersPage.loading")}
      emptyTitle={t("ordersPage.emptyTitle")}
      tableColCount={ORDER_TABLE_COL_COUNT}
      filterColumns={filterColumns}
      list={list}
      trailingActions={
        <>
          <Link to={`${ORDER_BASE}/import`} className="btn btn--ghost btn--sm">
            {t("ordersPage.importExcel")}
          </Link>
          <Link to={`${ORDER_BASE}/new`} className="btn btn--primary btn--sm">
            {t("ordersPage.newOrder")}
          </Link>
        </>
      }
      emptyActions={
        <>
          <Link to={`${ORDER_BASE}/new`} className="btn btn--primary">
            {t("ordersPage.newOrder")}
          </Link>
          <Link to={`${ORDER_BASE}/import`} className="btn btn--ghost">
            {t("ordersPage.importExcel")}
          </Link>
        </>
      }
      toolbarExtra={
        selectedIds.size > 0 ? (
          <div className="module-list-toolbar__selection">
            <p className="module-list-toolbar__meta">
              {t("ordersPage.selectedCount", { count: selectedIds.size })}
              {lockedCustomerLabel ? ` · ${lockedCustomerLabel}` : ""}
            </p>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => handleBookSelected()}>
              {t("ordersPage.bookSelected", { count: selectedIds.size })}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setSelectedIds(new Set())}
            >
              {t("ordersPage.clearSelection")}
            </button>
          </div>
        ) : null
      }
      tableHead={
        <>
          <th scope="col" className="dash-table__check-col">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              disabled={visibleSelectable.length === 0}
              onChange={() => toggleSelectAllVisible()}
              aria-label={t("ordersPage.selectAllVisible")}
            />
          </th>
          <th scope="col">{t("ordersPage.thOrderNumber")}</th>
          <th scope="col">{t("tradeField.contractualCustomer")}</th>
          <th scope="col">{t("ordersPage.placeOfReceiptLabel")}</th>
          <th scope="col">{t("ordersPage.portOfLoadingLabel")}</th>
          <th scope="col">{t("ordersPage.portOfDischargeLabel")}</th>
          <th scope="col">{t("ordersPage.placeOfDeliveryLabel")}</th>
          <th scope="col">{t("ordersPage.windowStartLabel")}</th>
          <th scope="col">{t("ordersPage.windowEndLabel")}</th>
          <th scope="col">{t("ordersPage.incotermLabel")}</th>
          <th scope="col">{t("ordersPage.thTransport")}</th>
          <th scope="col">{t("ordersPage.thStatus")}</th>
          <th scope="col">{t("ordersPage.thLines")}</th>
        </>
      }
    >
      {(filteredItems) =>
        filteredItems.map((row) => {
          const selectable = canSelectOrderForBooking(row, selectedCustomerKey);
          const disabledReason = !selectable
            ? selectedCustomerKey && normalizeCustomerKey(row.customer) !== selectedCustomerKey
              ? t("ordersPage.differentCustomerDisabled", { customer: lockedCustomerLabel })
              : t("ordersPage.orderNotBookable")
            : undefined;

          return (
            <tr key={row.id} className={selectedIds.has(row.id) ? "dash-table__row--selected" : undefined}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  disabled={!selectable}
                  title={disabledReason}
                  onChange={() => toggleOrderSelection(row)}
                  aria-label={t("ordersPage.selectOrder", { orderNumber: row.orderNumber })}
                />
              </td>
              <td>
                <Link to={`${ORDER_BASE}/${row.id}`} className="dash-table__link order-code">
                  {row.orderNumber}
                </Link>
              </td>
              <td>{row.customer}</td>
              <td>
                <LocationCell code={row.placeOfReceipt} />
              </td>
              <td>
                <LocationCell code={row.portOfLoading} />
              </td>
              <td>
                <LocationCell code={row.portOfDischarge} />
              </td>
              <td>
                <LocationCell code={row.placeOfDelivery} />
              </td>
              <td className="dash-table__date">{formatOrderDate(row.shippingWindowStart)}</td>
              <td className="dash-table__date">{formatOrderDate(row.shippingWindowEnd)}</td>
              <td>{formatOrderField(row.incoterm)}</td>
              <td>{transportModeLabel(row.transportMode, t)}</td>
              <td>
                <span className={orderStatusClass(row.status)}>{orderStatusLabel(row.status, t)}</span>
              </td>
              <td>
                <span className="order-line-count">{row.lines.length}</span>
              </td>
            </tr>
          );
        })
      }
    </ModuleListPage>
  );
}
