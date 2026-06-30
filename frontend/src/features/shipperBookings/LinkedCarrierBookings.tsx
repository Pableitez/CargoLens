import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as carrierBookingsApi from "../../api/carrierBookings";
import {
  carrierBookingStatusClass,
  carrierBookingStatusLabel,
  formatCarrierBookingDate,
} from "../carrierBookings/carrierBookingUtils";
import type { CarrierBookingRequest } from "../carrierBookings/types";
import { useIsClientPortal } from "../../hooks/useIsClientPortal";
import { useAppTranslation } from "../../i18n/useAppTranslation";

const CARRIER_BOOKING_BASE = "/dashboard/operations/transport/carrier-booking";

type LinkedCarrierBookingsProps = {
  shipperBookingId: string;
};

export function LinkedCarrierBookings({ shipperBookingId }: LinkedCarrierBookingsProps) {
  const { t } = useAppTranslation();
  const isClientPortal = useIsClientPortal();
  const [items, setItems] = useState<CarrierBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await carrierBookingsApi.fetchCarrierBookings({ shipperBookingId });
      setItems(rows);
    } catch {
      setItems([]);
      setError(t("shipperBookingsPage.linkedCarrierBookingsError"));
    } finally {
      setLoading(false);
    }
  }, [shipperBookingId, t]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const createHref = `${CARRIER_BOOKING_BASE}/new/from-sb?shipperBookingIds=${encodeURIComponent(shipperBookingId)}`;

  if (loading) {
    return <p className="panel__muted">{t("shipperBookingsPage.linkedCarrierBookingsLoading")}</p>;
  }

  return (
    <section className="order-section" aria-labelledby="sb-linked-cb-heading">
      <div className="panel__head-row panel__head-row--section">
        <h3 id="sb-linked-cb-heading" className="order-section__title">
          {t("shipperBookingsPage.linkedCarrierBookingsTitle")}
        </h3>
        {!isClientPortal ? (
          <Link to={createHref} className="btn btn--secondary btn--sm">
            {t("shipperBookingsPage.createCarrierBooking")}
          </Link>
        ) : null}
      </div>

      {error ? (
        <p className="panel__error" role="alert">
          {error}{" "}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => load()}>
            {t("shipperBookingsPage.linkedCarrierBookingsRetry")}
          </button>
        </p>
      ) : null}

      {items.length === 0 && !error ? (
        <div className="panel__empty-inline">
          <p className="panel__muted">{t("shipperBookingsPage.linkedCarrierBookingsEmpty")}</p>
          {!isClientPortal ? (
            <Link to={createHref} className="btn btn--primary btn--sm">
              {t("shipperBookingsPage.createCarrierBooking")}
            </Link>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="dash-table-wrap">
          <table className="dash-table order-lines-table">
            <thead>
              <tr>
                <th scope="col">{t("carrierBookingsPage.thRequestReference")}</th>
                <th scope="col">{t("carrierBookingsPage.thCarrier")}</th>
                <th scope="col">{t("carrierBookingsPage.thStatus")}</th>
                <th scope="col">{t("carrierBookingsPage.thSubmitted")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link to={`${CARRIER_BOOKING_BASE}/${row.id}`} className="dash-table__link order-code">
                      {row.requestReference}
                    </Link>
                    {row.externalReference ? (
                      <span className="dash-table__meta"> · {row.externalReference}</span>
                    ) : null}
                  </td>
                  <td>
                    {row.carrierScac}
                    {row.carrierName ? ` · ${row.carrierName}` : ""}
                  </td>
                  <td>
                    <span className={carrierBookingStatusClass(row.status)}>
                      {carrierBookingStatusLabel(row.status, t)}
                    </span>
                  </td>
                  <td className="dash-table__date">{formatCarrierBookingDate(row.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
