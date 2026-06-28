import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import * as carrierBookingsApi from "../../api/carrierBookings";
import { LocationCell } from "../../components/LocationCombobox";
import { ModuleListPage } from "../../components/ModuleListPage";
import { useModuleListPage } from "../../hooks/useModuleListPage";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import type { ColumnFilterDef } from "../../utils/facetFilters";
import {
  buildDateFilterColumn,
  buildDiscreteFilterColumn,
  buildRouteLocationFilterColumns,
  buildTextFilterColumn,
} from "../../utils/moduleFilterColumns";
import {
  carrierBookingStatusClass,
  carrierBookingStatusLabel,
  formatCarrierBookingDate,
} from "./carrierBookingUtils";
import { ShipperBookingRefLinks } from "./ShipperBookingRefLinks";
import type { CarrierBookingRequest } from "./types";

const CARRIER_BOOKING_BASE = "/dashboard/operations/transport/carrier-booking";
const TABLE_COL_COUNT = 8;

export function DashboardCarrierBookings() {
  const { t } = useAppTranslation();
  const fetchItems = useCallback(() => carrierBookingsApi.fetchCarrierBookings(), []);

  const filterColumns = useMemo<ColumnFilterDef<CarrierBookingRequest>[]>(
    () => [
      buildTextFilterColumn(
        "requestReference",
        t("carrierBookingsPage.thRequestReference"),
        (row) => [row.requestReference, row.shipperBookingReference, row.externalReference].join(" "),
        (row) => [row.requestReference]
      ),
      buildTextFilterColumn(
        "shipperBooking",
        t("carrierBookingsPage.thShipperBooking"),
        (row) => row.shipperBookingReference,
        (row) => [row.shipperBookingReference]
      ),
      buildDiscreteFilterColumn(
        "carrier",
        t("carrierBookingsPage.thCarrier"),
        (row) => `${row.carrierScac} — ${row.carrierName}`,
        (row) => [row.carrierScac, row.carrierName]
      ),
      ...buildRouteLocationFilterColumns<CarrierBookingRequest>({
        placeOfReceipt: t("carrierBookingsPage.placeOfReceiptLabel"),
        portOfLoading: t("carrierBookingsPage.portOfLoadingLabel"),
        portOfDischarge: t("carrierBookingsPage.portOfDischargeLabel"),
        placeOfDelivery: t("carrierBookingsPage.placeOfDeliveryLabel"),
        getPlaceOfReceipt: (row) => row.placeOfReceipt,
        getPortOfLoading: (row) => row.portOfLoading,
        getPortOfDischarge: (row) => row.portOfDischarge,
        getPlaceOfDelivery: (row) => row.placeOfDelivery,
      }),
      buildDiscreteFilterColumn("provider", t("carrierBookingsPage.thProvider"), (row) =>
        row.provider.toUpperCase()
      ),
      buildDiscreteFilterColumn(
        "environment",
        t("carrierBookingsPage.thEnvironment"),
        (row) => row.environment
      ),
      buildDiscreteFilterColumn("status", t("carrierBookingsPage.thStatus"), (row) =>
        carrierBookingStatusLabel(row.status, t)
      ),
      buildDateFilterColumn(
        "submittedAt",
        t("carrierBookingsPage.thSubmitted"),
        (row) => row.submittedAt,
        formatCarrierBookingDate
      ),
    ],
    [t]
  );

  const list = useModuleListPage(fetchItems, "carrierBookingsPage.loadFailed", filterColumns);

  return (
    <ModuleListPage
      headingId="carrier-bookings-heading"
      title={t("carrierBookingsPage.title")}
      lead={t("carrierBookingsPage.lead")}
      panelClassName="panel--orders"
      searchPlaceholder={t("carrierBookingsPage.searchPlaceholder")}
      wideTable
      loadingLabel={t("carrierBookingsPage.loading")}
      emptyTitle={t("carrierBookingsPage.emptyTitle")}
      emptyBody={t("carrierBookingsPage.emptyBody")}
      tableColCount={TABLE_COL_COUNT}
      filterColumns={filterColumns}
      list={list}
      trailingActions={
        <Link to={`${CARRIER_BOOKING_BASE}/new`} className="btn btn--primary btn--sm">
          {t("carrierBookingsPage.create")}
        </Link>
      }
      emptyActions={
        <Link to={`${CARRIER_BOOKING_BASE}/new`} className="btn btn--primary">
          {t("carrierBookingsPage.create")}
        </Link>
      }
      tableHead={
        <>
          <th scope="col">{t("carrierBookingsPage.thRequestReference")}</th>
          <th scope="col">{t("carrierBookingsPage.thShipperBooking")}</th>
          <th scope="col">{t("carrierBookingsPage.thCarrier")}</th>
          <th scope="col">{t("carrierBookingsPage.portOfLoadingLabel")}</th>
          <th scope="col">{t("carrierBookingsPage.portOfDischargeLabel")}</th>
          <th scope="col">{t("carrierBookingsPage.thProvider")}</th>
          <th scope="col">{t("carrierBookingsPage.thStatus")}</th>
          <th scope="col">{t("carrierBookingsPage.thSubmitted")}</th>
        </>
      }
    >
      {(filteredItems) =>
        filteredItems.map((row) => (
          <tr key={row.id}>
            <td>
              <Link to={`${CARRIER_BOOKING_BASE}/${row.id}`} className="dash-table__link order-code">
                {row.requestReference}
              </Link>
            </td>
            <td>
              <ShipperBookingRefLinks row={row} />
            </td>
            <td>
              {row.carrierScac}
              {row.carrierName ? ` · ${row.carrierName}` : ""}
            </td>
            <td>
              <LocationCell code={row.portOfLoading} />
            </td>
            <td>
              <LocationCell code={row.portOfDischarge} />
            </td>
            <td>{row.provider.toUpperCase()}</td>
            <td>
              <span className={carrierBookingStatusClass(row.status)}>
                {carrierBookingStatusLabel(row.status, t)}
              </span>
            </td>
            <td className="dash-table__date">{formatCarrierBookingDate(row.submittedAt)}</td>
          </tr>
        ))
      }
    </ModuleListPage>
  );
}
