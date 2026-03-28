import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as activityApi from "../api/activity.js";
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

// Staff: desplegable compacto de actividad reciente (enlace a la página completa).
export function NotificationBell() {
  const { t, tRef, dateLocale } = useStableT();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [seenRev, setSeenRev] = useState(0);
  const wrapRef = useRef(null);

  const unreadCount = useMemo(() => {
    const gate = seenRev >= 0;
    const t0 = getLastSeenMs();
    return items.filter((r) => gate && new Date(r.createdAt).getTime() > t0).length;
  }, [items, seenRev]);

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
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(load, { timeout: 2500 })
        : null;
    const fallbackTimer = idle == null ? window.setTimeout(load, 400) : null;
    return () => {
      cancelled = true;
      if (idle != null) cancelIdleCallback(idle);
      if (fallbackTimer != null) clearTimeout(fallbackTimer);
    };
  }, [tRef]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function onDismiss() {
    persistLastSeenFromItems(items);
    setSeenRev((v) => v + 1);
  }

  return (
    <div className="notification-bell" ref={wrapRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="notification-bell__icon" aria-hidden>
          ◉
        </span>
        {unreadCount > 0 ? (
          <span className="notification-bell__badge" aria-hidden>
            {Math.min(unreadCount, 9)}
            {unreadCount > 9 ? "+" : ""}
          </span>
        ) : null}
        <span className="sr-only">{t("notifications.title")}</span>
      </button>
      {open ? (
        <div className="notification-bell__panel" role="menu">
          <p className="notification-bell__head">{t("notifications.title")}</p>
          {error ? (
            <p className="notification-bell__err">{error}</p>
          ) : items.length === 0 ? (
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
            <button type="button" className="notification-bell__dismiss" onClick={onDismiss}>
              {t("notifications.dismiss")}
            </button>
          ) : null}
          <Link to="/dashboard/activity" className="notification-bell__link" role="menuitem" onClick={() => setOpen(false)}>
            {t("notifications.viewAll")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
