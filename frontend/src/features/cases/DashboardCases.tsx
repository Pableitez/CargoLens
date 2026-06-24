import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as casesApi from "../../api/cases";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { caseStatusLabel, formatCaseDate, tradeDirectionLabel } from "./caseUtils";
import type { Case } from "./types";

export function DashboardCases() {
  const { t } = useAppTranslation();
  const [items, setItems] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await casesApi.fetchCases();
      setItems(rows);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "casesPage.loadFailed"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return (
    <section className="panel panel--dash-form" aria-labelledby="cases-heading">
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("workspace.section.cases.topbar") },
        ]}
      />
      <div className="panel__head-row">
        <h2 id="cases-heading" className="panel__title panel__title--section">
          {t("casesPage.title")}
        </h2>
        <div className="dash-form__actions">
          <Link to="/dashboard/shipments" className="btn btn--ghost">
            {t("modules.nav.shipments")}
          </Link>
          <Link to="/dashboard/cases/new" className="btn btn--primary">
            {t("casesPage.newCase")}
          </Link>
        </div>
      </div>
      <p className="panel__lead">{t("casesPage.lead")}</p>

      {loading && <p className="panel__muted">{t("casesPage.loading")}</p>}
      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state empty-state--compact empty-state--panel">
          <p className="empty-state__title">{t("casesPage.emptyTitle")}</p>
          <p className="empty-state__body">{t("casesPage.emptyBody")}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="dash-table-wrap dash-table-wrap--mt">
          <table className="dash-table">
            <thead>
              <tr>
                <th scope="col">{t("casesPage.thReference")}</th>
                <th scope="col">{t("casesPage.thTitle")}</th>
                <th scope="col">{t("casesPage.thRoute")}</th>
                <th scope="col">{t("casesPage.thTrade")}</th>
                <th scope="col">{t("casesPage.thStatus")}</th>
                <th scope="col">{t("casesPage.thShipments")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link to={`/dashboard/cases/${row.id}`} className="dash-table__link">
                      {row.reference}
                    </Link>
                  </td>
                  <td>{row.title || "—"}</td>
                  <td>
                    {row.origin || "—"} → {row.destination || "—"}
                  </td>
                  <td>{tradeDirectionLabel(row.tradeDirection, t)}</td>
                  <td>
                    <span className="source-badge source-badge--demo">{caseStatusLabel(row.status, t)}</span>
                  </td>
                  <td>{row.shipmentIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
