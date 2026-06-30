import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import * as shipperBookingsApi from "../../api/shipperBookings";
import { LocationCell } from "../../components/LocationCombobox";
import { ModuleListPage } from "../../components/ModuleListPage";
import { useModuleListPage } from "../../hooks/useModuleListPage";
import { useIsClientPortal } from "../../hooks/useIsClientPortal";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import type { ColumnFilterDef } from "../../utils/facetFilters";
import {
  buildDateFilterColumn,
  buildDiscreteFilterColumn,
  buildPartyFilterColumns,
  buildRouteLocationFilterColumns,
  buildTextFilterColumn,
} from "../../utils/moduleFilterColumns";
import {
  bookingStatusClass,
  bookingStatusLabel,
  formatBookingDate,
  transportModeLabel,
} from "./shipperBookingUtils";
import type { ShipperBooking } from "./types";

const BOOKING_BASE = "/dashboard/operations/export/shipper-booking";
const BOOKING_TABLE_COL_COUNT = 13;

function formatBookingField(value: string): string {
  return value.trim() || "—";
}

export function DashboardShipperBookings() {
  const { t } = useAppTranslation();
  const isClientPortal = useIsClientPortal();
  const fetchItems = useCallback(() => shipperBookingsApi.fetchShipperBookings(), []);

  const filterColumns = useMemo<ColumnFilterDef<ShipperBooking>[]>(
    () => [
      buildTextFilterColumn(
        "bookingReference",
        t("shipperBookingsPage.thBookingReference"),
        (row) => [row.bookingReference, row.customerReferenceNumber].join(" "),
        (row) => [row.bookingReference]
      ),
      ...buildPartyFilterColumns<ShipperBooking>({
        customer: t("tradeField.contractualCustomer"),
        shipper: t("tradeField.shipper"),
        consignee: t("tradeField.consignee"),
        getCustomer: (row) => row.customer,
        getShipper: (row) => row.shipper,
        getConsignee: (row) => row.consignee,
      }),
      ...buildRouteLocationFilterColumns<ShipperBooking>({
        placeOfReceipt: t("shipperBookingsPage.placeOfReceiptLabel"),
        portOfLoading: t("shipperBookingsPage.portOfLoadingLabel"),
        portOfDischarge: t("shipperBookingsPage.portOfDischargeLabel"),
        placeOfDelivery: t("shipperBookingsPage.placeOfDeliveryLabel"),
        getPlaceOfReceipt: (row) => row.placeOfReceipt,
        getPortOfLoading: (row) => row.portOfLoading,
        getPortOfDischarge: (row) => row.portOfDischarge,
        getPlaceOfDelivery: (row) => row.placeOfDelivery,
      }),
      buildDateFilterColumn(
        "cargoReadyDate",
        t("shipperBookingsPage.cargoReadyDateLabel"),
        (row) => row.cargoReadyDate,
        formatBookingDate
      ),
      buildDateFilterColumn(
        "expectedReceiptDate",
        t("shipperBookingsPage.expectedReceiptDateLabel"),
        (row) => row.expectedReceiptDate,
        formatBookingDate
      ),
      buildDateFilterColumn(
        "expectedDeliveryDate",
        t("shipperBookingsPage.expectedDeliveryDateLabel"),
        (row) => row.expectedDeliveryDate,
        formatBookingDate
      ),
      buildDiscreteFilterColumn(
        "incoterm",
        t("shipperBookingsPage.incotermLabel"),
        (row) => row.incoterm || "—",
        (row) => (row.incoterm ? [row.incoterm] : [])
      ),
      buildDiscreteFilterColumn("transport", t("shipperBookingsPage.thTransport"), (row) =>
        transportModeLabel(row.transportMode, t)
      ),
      buildDiscreteFilterColumn("status", t("shipperBookingsPage.thStatus"), (row) =>
        bookingStatusLabel(row.status, t)
      ),
      buildTextFilterColumn(
        "lines",
        t("shipperBookingsPage.thLines"),
        (row) =>
          [
            String(row.lines.length),
            ...row.lines.map((line) =>
              [line.lineKey, line.orderNumber, line.sku, line.description].join(" ")
            ),
          ].join(" "),
        (row) => [String(row.lines.length), ...row.lines.map((line) => line.sku).filter(Boolean)]
      ),
    ],
    [t]
  );

  const list = useModuleListPage(fetchItems, "shipperBookingsPage.loadFailed", filterColumns);

  return (
    <ModuleListPage
      headingId="shipper-bookings-heading"
      title={t("shipperBookingsPage.title")}
      lead={isClientPortal ? t("shipperBookingsPage.leadPortal") : t("shipperBookingsPage.lead")}
      panelClassName="panel--orders"
      searchPlaceholder={t("shipperBookingsPage.searchPlaceholder")}
      wideTable
      loadingLabel={t("shipperBookingsPage.loading")}
      emptyTitle={t("shipperBookingsPage.emptyTitle")}
      emptyBody={t("shipperBookingsPage.emptyBody")}
      tableColCount={BOOKING_TABLE_COL_COUNT}
      filterColumns={filterColumns}
      list={list}
      trailingActions={
        isClientPortal ? null : (
          <>
            <Link to={`${BOOKING_BASE}/import`} className="btn btn--ghost btn--sm">
              {t("shipperBookingsPage.importExcel")}
            </Link>
            <Link to={`${BOOKING_BASE}/new`} className="btn btn--primary btn--sm">
              {t("shipperBookingsPage.newBooking")}
            </Link>
          </>
        )
      }
      emptyActions={
        isClientPortal ? null : (
          <>
            <Link to={`${BOOKING_BASE}/new`} className="btn btn--primary">
              {t("shipperBookingsPage.newBooking")}
            </Link>
            <Link to={`${BOOKING_BASE}/import`} className="btn btn--ghost">
              {t("shipperBookingsPage.importExcel")}
            </Link>
          </>
        )
      }
      tableHead={
        <>
          <th scope="col">{t("shipperBookingsPage.thBookingReference")}</th>
          <th scope="col">{t("tradeField.contractualCustomer")}</th>
          <th scope="col">{t("shipperBookingsPage.placeOfReceiptLabel")}</th>
          <th scope="col">{t("shipperBookingsPage.portOfLoadingLabel")}</th>
          <th scope="col">{t("shipperBookingsPage.portOfDischargeLabel")}</th>
          <th scope="col">{t("shipperBookingsPage.placeOfDeliveryLabel")}</th>
          <th scope="col">{t("shipperBookingsPage.cargoReadyDateLabel")}</th>
          <th scope="col">{t("shipperBookingsPage.expectedReceiptDateLabel")}</th>
          <th scope="col">{t("shipperBookingsPage.expectedDeliveryDateLabel")}</th>
          <th scope="col">{t("shipperBookingsPage.incotermLabel")}</th>
          <th scope="col">{t("shipperBookingsPage.thTransport")}</th>
          <th scope="col">{t("shipperBookingsPage.thStatus")}</th>
          <th scope="col">{t("shipperBookingsPage.thLines")}</th>
        </>
      }
    >
      {(filteredItems) =>
        filteredItems.map((row) => (
          <tr key={row.id}>
            <td>
              <Link to={`${BOOKING_BASE}/${row.id}`} className="dash-table__link order-code">
                {row.bookingReference}
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
            <td className="dash-table__date">{formatBookingDate(row.cargoReadyDate)}</td>
            <td className="dash-table__date">{formatBookingDate(row.expectedReceiptDate)}</td>
            <td className="dash-table__date">{formatBookingDate(row.expectedDeliveryDate)}</td>
            <td>{formatBookingField(row.incoterm)}</td>
            <td>{transportModeLabel(row.transportMode, t)}</td>
            <td>
              <span className={bookingStatusClass(row.status)}>{bookingStatusLabel(row.status, t)}</span>
            </td>
            <td>
              <span className="order-line-count">{row.lines.length}</span>
            </td>
          </tr>
        ))
      }
    </ModuleListPage>
  );
}
