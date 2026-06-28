import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as carrierBookingsApi from "../../api/carrierBookings";
import { carrierBookingStatusClass, carrierBookingStatusLabel } from "../carrierBookings/carrierBookingUtils";
import type { CarrierBookingRequest } from "../carrierBookings/types";
import { useAppTranslation } from "../../i18n/useAppTranslation";

const CARRIER_BOOKING_BASE = "/dashboard/operations/transport/carrier-booking";

type LinkedCarrierBookingsProps = {
  shipperBookingId: string;
};

export function LinkedCarrierBookings({ shipperBookingId }: LinkedCarrierBookingsProps) {
  const { t } = useAppTranslation();
  const [items, setItems] = useState<CarrierBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    carrierBookingsApi
      .fetchCarrierBookings({ shipperBookingId })
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shipperBookingId]);

  if (loading) {
    return <p className="panel__muted">{t("shipperBookingsPage.linkedCarrierBookingsLoading")}</p>;
  }

  return (
    <section className="order-section" aria-labelledby="sb-linked-cb-heading">
      <h3 id="sb-linked-cb-heading" className="order-section__title">
        {t("shipperBookingsPage.linkedCarrierBookingsTitle")}
      </h3>
      {items.length === 0 ? (
        <p className="panel__muted">{t("shipperBookingsPage.linkedCarrierBookingsEmpty")}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table order-lines-table">
            <thead>
              <tr>
                <th scope="col">{t("carrierBookingsPage.thRequestReference")}</th>
                <th scope="col">{t("carrierBookingsPage.thCarrier")}</th>
                <th scope="col">{t("carrierBookingsPage.thStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link to={`${CARRIER_BOOKING_BASE}/${row.id}`} className="dash-table__link order-code">
                      {row.requestReference}
                    </Link>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
