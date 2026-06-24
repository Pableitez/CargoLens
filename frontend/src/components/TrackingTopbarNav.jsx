import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { SIDEBAR_LEGACY_LINKS } from "./sidebarModuleConfig.js";
import {
  CLIENT_TRACKING_TOPBAR_LINKS,
  GUEST_TRACKING_TOPBAR_LINKS,
  STAFF_TRACKING_TOPBAR_LINKS,
} from "../config/moduleRegistry.ts";
import { prefetchRoute } from "../utils/prefetchRoutes.js";

const STAFF_TRACKING_LEGACY = SIDEBAR_LEGACY_LINKS.filter((link) =>
  ["clients", "add", "import", "activity"].includes(link.id)
);

function matchNavRoute(pathname, route, { end = false } = {}) {
  if (route === "/") return pathname === "/";
  if (end) return pathname === route;
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isTrackingRoute(pathname, links, legacyLinks) {
  if (pathname.startsWith("/dashboard/tracking") || pathname.startsWith("/track")) return true;
  const all = [...links, ...legacyLinks];
  return all.some((item) => {
    const end = item.id === "search" && item.route === "/";
    return matchNavRoute(pathname, item.route, { end });
  });
}

function resolveTrackingLinks(user) {
  if (!user) return GUEST_TRACKING_TOPBAR_LINKS;
  if (user.isClientPortal) return CLIENT_TRACKING_TOPBAR_LINKS;
  return STAFF_TRACKING_TOPBAR_LINKS;
}

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrackingTopbarNav() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const links = resolveTrackingLinks(user);
  const legacyLinks = user && !user.isClientPortal ? STAFF_TRACKING_LEGACY : [];
  const trackingActive = isTrackingRoute(pathname, links, legacyLinks);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (loading) return null;

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`topbar-tracking${open ? " topbar-tracking--open" : ""}`}>
      <button
        type="button"
        className={`shell-nav-pill topbar-tracking__trigger${trackingActive ? " shell-nav-pill--active" : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{t("modules.nav.tracking")}</span>
        <span className="topbar-tracking__chevron" aria-hidden>
          <IconChevronDown />
        </span>
      </button>
      {open ? (
        <div className="shell-nav-menu topbar-tracking__menu" role="menu">
          {links.map((item) => (
            <NavLink
              key={item.id}
              to={item.route}
              end={item.id === "search"}
              role="menuitem"
              className={({ isActive }) =>
                `shell-nav-menu__item topbar-tracking__item${isActive ? " shell-nav-menu__item--active topbar-tracking__item--active" : ""}`
              }
              onClick={closeMenu}
              onMouseEnter={() => prefetchRoute(item.route)}
            >
              {t(item.i18nKey)}
            </NavLink>
          ))}
          {legacyLinks.length > 0 ? (
            <>
              <div className="shell-nav-menu__divider topbar-tracking__menu-divider" role="separator" />
              <p className="shell-nav-menu__heading topbar-tracking__menu-heading">
                {t("modules.legacy.title")}
              </p>
              {legacyLinks.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.route}
                  role="menuitem"
                  className={({ isActive }) =>
                    `shell-nav-menu__item shell-nav-menu__item--muted topbar-tracking__item topbar-tracking__item--muted${isActive ? " shell-nav-menu__item--active topbar-tracking__item--active" : ""}`
                  }
                  onClick={closeMenu}
                  onMouseEnter={() => prefetchRoute(item.route)}
                >
                  {t(item.i18nKey)}
                </NavLink>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
