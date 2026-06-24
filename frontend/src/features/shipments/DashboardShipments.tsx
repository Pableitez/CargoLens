import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as shipmentsApi from "../../api/shipments";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { formatShipmentDate, shipmentStatusLabel } from "./shipmentUtils";
import type { Shipment } from "./types";

export function DashboardShipments() {
  const { t } = useAppTranslation();
  const [items, setItems] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await shipmentsApi.fetchShipments();
      setItems(rows);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "shipmentsPage.loadFailed"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return (
    <section className="panel panel--dash-form" aria-labelledby="shipments-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/overview" },
          { label: t("workspace.section.shipments.topbar") },
        ]}
      />
      <div className="panel__head-row">
        <h2 id="shipments-heading" className="panel__title panel__title--section">
          {t("shipmentsPage.title")}
        </h2>
        <Link to="/dashboard/shipments/new" className="btn btn--primary">
          {t("shipmentsPage.newShipment")}
        </Link>
      </div>
      <p className="panel__lead">{t("shipmentsPage.lead")}</p>

      {loading && <p className="panel__muted">{t("shipmentsPage.loading")}</p>}
      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state empty-state--compact empty-state--panel">
          <p className="empty-state__title">{t("shipmentsPage.emptyTitle")}</p>
          <p className="empty-state__body">{t("shipmentsPage.emptyBody")}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="dash-table-wrap dash-table-wrap--mt">
          <table className="dash-table">
            <thead>
              <tr>
                <th scope="col">{t("shipmentsPage.thReference")}</th>
                <th scope="col">{t("shipmentsPage.thRoute")}</th>
                <th scope="col">{t("shipmentsPage.thEta")}</th>
                <th scope="col">{t("shipmentsPage.thStatus")}</th>
                <th scope="col">{t("shipmentsPage.thContainers")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link to={`/dashboard/shipments/${row.id}`} className="dash-table__link">
                      {row.reference}
                    </Link>
                  </td>
                  <td>
                    {row.origin || "—"} → {row.destination || "—"}
                  </td>
                  <td>{formatShipmentDate(row.eta)}</td>
                  <td>
                    <span className="source-badge source-badge--demo">
                      {shipmentStatusLabel(row.status, t)}
                    </span>
                  </td>
                  <td>{row.containers.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
