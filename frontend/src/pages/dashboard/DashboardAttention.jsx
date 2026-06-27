import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DASHBOARD_OVERVIEW_PATH } from "../../config/paths.js";
import { DashboardPageSkeleton } from "../../components/DashboardPageSkeleton.jsx";
import * as containersApi from "../../api/containers";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useStableT } from "../../i18n/useStableT.js";

export function DashboardAttention() {
  const { t, tRef } = useStableT();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let c = false;
    (async () => {
      setError("");
      setLoading(true);
      try {
        const data = await containersApi.fetchContainersOverviewMap();
        if (!c) setPayload(data);
      } catch (e) {
        if (!c) setError(messageFromApiErrorOrKey(e, tRef.current, "dashboardPage.attention.loadFailed"));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch; tRef.current stays fresh
  }, []);

  const items = payload?.items ?? [];
  const failed = items.filter((it) => !it.ok);
  const ok = items.filter((it) => it.ok);

  return (
    <section className="panel panel--dash-form" aria-labelledby="attention-heading">
      <h2 id="attention-heading" className="sr-only">
        {t("dashboardPage.attention.pageTitle")}
      </h2>
      {payload?.mode === "mock" && payload.hint ? <p className="overview-map__hint">{payload.hint}</p> : null}
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <DashboardPageSkeleton rows={5} />
      ) : !payload || payload.mode === "empty" ? (
        <div className="empty-state empty-state--compact">
          <p className="empty-state__title">{t("dashboardPage.attention.emptyTitle")}</p>
          <Link to="/dashboard/add" className="btn btn--primary btn--sm">
            {t("dashboardPage.attention.addSome")}
          </Link>
        </div>
      ) : (
        <>
          <div className="attention-stats">
            <div className="dash-stat">
              <span className="dash-stat__value">{ok.length}</span>
              <span className="dash-stat__label">{t("dashboardPage.attention.statOk")}</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__value">{failed.length}</span>
              <span className="dash-stat__label">{t("dashboardPage.attention.statFailed")}</span>
            </div>
          </div>
          {failed.length > 0 ? (
            <div className="attention-failed">
              <h3 className="attention-failed__title">{t("dashboardPage.attention.failedTitle")}</h3>
              <ul className="attention-failed__list">
                {failed.map((it) => (
                  <li key={it.containerNumber}>
                    <Link
                      className="attention-failed__link"
                      to={`${DASHBOARD_OVERVIEW_PATH}?q=${encodeURIComponent(it.containerNumber)}`}
                    >
                      {it.containerNumber}
                    </Link>
                    <span className="attention-failed__msg">
                      {it.error ?? t("dashboardPage.attention.noData")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="panel__muted">{t("dashboardPage.attention.allOk")}</p>
          )}
        </>
      )}
    </section>
  );
}
