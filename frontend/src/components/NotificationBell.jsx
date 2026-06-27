import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as activityApi from "../api/activity";
import { useBackgroundJobsOptional } from "../contexts/BackgroundJobsContext";
import { formatDateTimeWithZone, parseValidDateIso } from "../pages/dashboard/dashboardUtils.js";
import { messageFromApiErrorOrKey } from "../i18n/apiMessage.js";
import { useStableT } from "../i18n/useStableT.js";

const LAST_SEEN_KEY = "fb.workspaceActivityLastSeenAt";

function getLastSeenMs() {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    return raw ? Date.parse(raw) : 0;
  } catch {
    return 0;
  }
}

function persistLastSeenFromItems(items) {
  if (typeof localStorage === "undefined") return;
  if (!items.length) {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    return;
  }
  const maxTs = Math.max(...items.map((r) => new Date(r.createdAt).getTime()));
  localStorage.setItem(LAST_SEEN_KEY, new Date(maxTs).toISOString());
}

const JOB_KIND_I18N = {
  "import.trade_masters.parties": "backgroundJobs.kind.tradeMastersParties",
  "import.trade_masters.facilities": "backgroundJobs.kind.tradeMastersFacilities",
  "import.trade_masters.related_parties": "backgroundJobs.kind.tradeMastersRelatedParties",
  "import.trade_masters.related_facilities": "backgroundJobs.kind.tradeMastersRelatedFacilities",
  "import.orders": "backgroundJobs.kind.orders",
  "import.shipper_bookings": "backgroundJobs.kind.shipperBookings",
};

function jobKindLabel(kind, t) {
  const key = JOB_KIND_I18N[kind] ?? "backgroundJobs.kind.import";
  const label = t(key);
  return label !== key ? label : kind;
}

function jobStatusLabel(status, t) {
  const key = `backgroundJobs.status.${status}`;
  const label = t(key);
  return label !== key ? label : status;
}

// Staff: mismo botón de actividad; panel con 2 pestañas — Procesos | Actividad.
export function NotificationBell() {
  const { t, tRef, dateLocale } = useStableT();
  const backgroundJobs = useBackgroundJobsOptional();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("activity");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [seenRev, setSeenRev] = useState(0);
  const wrapRef = useRef(null);

  const activeJobs = backgroundJobs?.activeJobs ?? [];
  const settledJobs = useMemo(
    () => (backgroundJobs?.recentJobs ?? []).filter((j) => j.status === "completed" || j.status === "failed"),
    [backgroundJobs?.recentJobs]
  );

  const unreadActivityCount = useMemo(() => {
    const gate = seenRev >= 0;
    const t0 = getLastSeenMs();
    return items.filter((r) => gate && new Date(r.createdAt).getTime() > t0).length;
  }, [items, seenRev]);

  const unreadJobCount = useMemo(() => settledJobs.filter((job) => !job.readAt).length, [settledJobs]);

  const processesAttention = activeJobs.length + unreadJobCount;

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      (async () => {
        setError("");
        try {
          const list = await activityApi.fetchWorkspaceActivity({ limit: 8 });
          if (!cancelled) setItems(list);
        } catch (e) {
          if (!cancelled)
            setError(messageFromApiErrorOrKey(e, tRef.current, "dashboardPage.activity.loadFailed"));
        }
      })();
    };
    const idle =
      typeof requestIdleCallback !== "undefined" ? requestIdleCallback(load, { timeout: 2500 }) : null;
    const fallbackTimer = idle == null ? window.setTimeout(load, 400) : null;
    return () => {
      cancelled = true;
      if (idle != null) cancelIdleCallback(idle);
      if (fallbackTimer != null) clearTimeout(fallbackTimer);
    };
  }, [tRef]);

  useEffect(() => {
    if (!open) return;
    void backgroundJobs?.refreshJobs();
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, backgroundJobs]);

  function handleOpen() {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        setTab(activeJobs.length > 0 || unreadJobCount > 0 ? "processes" : "activity");
      }
      return !wasOpen;
    });
  }

  async function onDismissActivity() {
    persistLastSeenFromItems(items);
    setSeenRev((v) => v + 1);
  }

  async function onDismissProcesses() {
    await backgroundJobs?.markJobsRead();
  }

  const processRows = [...activeJobs, ...settledJobs.slice(0, 8)];

  return (
    <div className="notification-bell" ref={wrapRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={handleOpen}
      >
        <span className="notification-bell__icon" aria-hidden>
          ◉
        </span>
        {unreadActivityCount > 0 ? (
          <span className="notification-bell__badge" aria-hidden>
            {Math.min(unreadActivityCount, 9)}
            {unreadActivityCount > 9 ? "+" : ""}
          </span>
        ) : null}
        <span className="sr-only">{t("notifications.title")}</span>
      </button>
      {open ? (
        <div className="notification-bell__panel" role="menu">
          <div
            className="notification-bell__tabs"
            role="tablist"
            aria-label={t("notifications.panelTabsAria")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "processes"}
              className={`notification-bell__tab${tab === "processes" ? " notification-bell__tab--active" : ""}`}
              onClick={() => setTab("processes")}
            >
              {t("backgroundJobs.tabProcesses")}
              {processesAttention > 0 ? (
                <span className="notification-bell__tab-badge">{Math.min(processesAttention, 9)}</span>
              ) : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "activity"}
              className={`notification-bell__tab${tab === "activity" ? " notification-bell__tab--active" : ""}`}
              onClick={() => setTab("activity")}
            >
              {t("backgroundJobs.tabActivity")}
              {unreadActivityCount > 0 ? (
                <span className="notification-bell__tab-badge">{Math.min(unreadActivityCount, 9)}</span>
              ) : null}
            </button>
          </div>

          {tab === "processes" ? (
            <div className="notification-bell__pane" role="tabpanel">
              {activeJobs.length > 0 ? (
                <>
                  <p className="notification-bell__head">{t("backgroundJobs.sectionActive")}</p>
                  <ul className="notification-bell__list">
                    {activeJobs.map((job) => (
                      <li key={job.id} className="notification-bell__job notification-bell__job--active">
                        <span className="notification-bell__job-kind">{jobKindLabel(job.kind, t)}</span>
                        <span className="notification-bell__job-file">{job.fileName}</span>
                        <span className="notification-bell__job-status">
                          {jobStatusLabel(job.status, t)}
                          {job.progressMessage ? ` · ${job.progressMessage}` : ""}
                        </span>
                        <span
                          className="notification-bell__progress"
                          role="progressbar"
                          aria-valuenow={job.progressPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span
                            className="notification-bell__progress-bar"
                            style={{ width: `${job.progressPercent}%` }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {settledJobs.length > 0 ? (
                <>
                  <p className="notification-bell__head">{t("backgroundJobs.sectionRecent")}</p>
                  <ul className="notification-bell__list">
                    {settledJobs.slice(0, 8).map((job) => {
                      const whenIso = parseValidDateIso(job.completedAt ?? job.createdAt);
                      const whenText = formatDateTimeWithZone(job.completedAt ?? job.createdAt, dateLocale);
                      return (
                        <li
                          key={job.id}
                          className={`notification-bell__job notification-bell__job--${job.status}${!job.readAt ? " notification-bell__job--unread" : ""}`}
                        >
                          <span className="notification-bell__time">
                            {whenIso ? <time dateTime={whenIso}>{whenText}</time> : whenText}
                          </span>
                          <span className="notification-bell__summary">
                            {job.summary ||
                              `${jobKindLabel(job.kind, t)} · ${job.fileName} · ${jobStatusLabel(job.status, t)}`}
                          </span>
                          {job.errorMessage ? (
                            <span className="notification-bell__job-error">{job.errorMessage}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}

              {processRows.length === 0 ? (
                <p className="notification-bell__empty">{t("backgroundJobs.processesEmpty")}</p>
              ) : null}

              {processRows.length > 0 ? (
                <button
                  type="button"
                  className="notification-bell__dismiss"
                  onClick={() => void onDismissProcesses()}
                >
                  {t("notifications.dismiss")}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="notification-bell__pane" role="tabpanel">
              <p className="notification-bell__head">{t("notifications.title")}</p>
              {error ? <p className="notification-bell__err">{error}</p> : null}
              {items.length === 0 && !error ? (
                <p className="notification-bell__empty">{t("notifications.empty")}</p>
              ) : (
                <ul className="notification-bell__list">
                  {items.map((row) => {
                    const whenIso = parseValidDateIso(row.createdAt);
                    const whenText = formatDateTimeWithZone(row.createdAt, dateLocale);
                    return (
                      <li key={row.id}>
                        <span className="notification-bell__time">
                          {whenIso ? <time dateTime={whenIso}>{whenText}</time> : whenText}
                        </span>
                        <span className="notification-bell__summary">{row.summary}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {items.length > 0 ? (
                <button
                  type="button"
                  className="notification-bell__dismiss"
                  onClick={() => void onDismissActivity()}
                >
                  {t("notifications.dismiss")}
                </button>
              ) : null}
              <Link
                to="/dashboard/activity"
                className="notification-bell__link"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {t("notifications.viewAll")}
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
