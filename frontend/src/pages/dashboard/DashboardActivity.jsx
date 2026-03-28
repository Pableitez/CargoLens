import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as activityApi from "../../api/activity.js";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { DashboardPageSkeleton } from "../../components/DashboardPageSkeleton.jsx";
import { formatDateTimeWithZone, parseValidDateIso } from "./dashboardUtils.js";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useStableT } from "../../i18n/useStableT.js";

function actionLabel(action, t) {
  const map = {
    "container.create": "actionContainer",
    "container.delete": "actionContainer",
    "container.update": "actionContainer",
    "container.import": "actionImport",
    "client.create": "actionClient",
    "client.delete": "actionClient",
    "client.update": "actionClient",
  };
  const key = map[action];
  return key ? t(`dashboardPage.activity.${key}`) : action;
}

export function DashboardActivity() {
  const { t, tRef, dateLocale } = useStableT();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let c = false;
    (async () => {
      setError("");
      setLoading(true);
      try {
        const list = await activityApi.fetchWorkspaceActivity({ limit: 100 });
        if (!c) setItems(list);
      } catch (e) {
        if (!c) setError(messageFromApiErrorOrKey(e, tRef.current, "dashboardPage.activity.loadFailed"));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch; tRef.current stays fresh
  }, []);

  return (
    <section className="panel panel--dash-form" aria-labelledby="activity-heading">
      <PageBreadcrumb
        items={[
          { label: t("workspace.section.overview.topbar"), to: "/dashboard/overview" },
          { label: t("workspace.section.activity.topbar") },
        ]}
      />
      <h2 id="activity-heading" className="panel__title panel__title--section">
        {t("dashboardPage.activity.pageTitle")}
      </h2>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <DashboardPageSkeleton rows={6} />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden>
            ◎
          </div>
          <p className="empty-state__title">{t("dashboardPage.activity.emptyTitle")}</p>
          <p className="empty-state__body">{t("dashboardPage.activity.empty")}</p>
          <p className="empty-state__body empty-state__hint">{t("dashboardPage.activity.emptyCtaLead")}</p>
          <div className="empty-state__actions">
            <Link to="/dashboard/add" className="btn btn--primary btn--sm">
              {t("dashboardPage.activity.ctaAdd")}
            </Link>
            <Link to="/dashboard/import" className="btn btn--secondary btn--sm">
              {t("dashboardPage.activity.ctaImport")}
            </Link>
            <Link to="/dashboard/list" className="btn btn--ghost btn--sm">
              {t("dashboardPage.activity.ctaList")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th scope="col">{t("dashboardPage.activity.when")}</th>
                <th scope="col">{t("dashboardPage.activity.type")}</th>
                <th scope="col">{t("dashboardPage.activity.summary")}</th>
                <th scope="col">{t("dashboardPage.activity.user")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const whenIso = parseValidDateIso(row.createdAt);
                const whenText = formatDateTimeWithZone(row.createdAt, dateLocale);
                return (
                <tr key={row.id}>
                  <td className="dash-table__date">
                    {whenIso ? (
                      <time dateTime={whenIso}>{whenText}</time>
                    ) : (
                      whenText
                    )}
                  </td>
                  <td>
                    <span className="activity-badge">{actionLabel(row.action, t)}</span>
                  </td>
                  <td>{row.summary}</td>
                  <td className="dash-table__muted">{row.actorEmail ?? "—"}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
