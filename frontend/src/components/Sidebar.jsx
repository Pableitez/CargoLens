import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { appName } from "../config/siteMeta.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { prefetchRoute } from "../utils/prefetchRoutes.js";
import { getSidebarOpenInitial } from "./sidebarModuleConfig.js";
import { SidebarModuleNav } from "./SidebarModuleNav.jsx";
import { isDesktopSidebarFlyout, useFlyoutPanelStyle } from "./sidebarFlyout.js";

// Iniciales del avatar (empresa/cliente o parte local del email).
function getSidebarInitials(displayName, email) {
  const n = (displayName || "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase().slice(0, 2);
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  const local = (email || "").split("@")[0] || "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local.toUpperCase();
  return "?";
}

function IconTrack({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 19a7 7 0 100-14 7 7 0 000 14zm8-2l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGrid({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function IconShip({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14l2 5h12l2-5M6 14h12l-2-9H8L6 14zM9 5h6l-1-2h-4L9 5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUpload({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPlusBox({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconList({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClock({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconAlert({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 9v4M12 17h.01M10.3 4.8L2.6 18.4A1 1 0 003.4 20h17.2a1 1 0 00.8-1.6L13.7 4.8a1 1 0 00-1.7 0z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGear({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevronSidebar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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

const SIDEBAR_OPEN_INITIAL = getSidebarOpenInitial();

function SidebarNavSection({ sectionId, label, open, onToggle, children, flyout = true }) {
  const headRef = useRef(null);
  const panelId = `sidebar-section-${sectionId}`;
  const flyoutStyle = useFlyoutPanelStyle(open, flyout, headRef);
  const fixedFlyout = flyout && open && flyoutStyle;

  const panel = (
    <div
      id={panelId}
      role="region"
      aria-labelledby={`${panelId}-btn`}
      className={`sidebar__section-panel${flyout ? " sidebar__section-panel--flyout" : ""}${fixedFlyout ? " sidebar__section-panel--fixed" : ""}`}
      style={fixedFlyout ? flyoutStyle : undefined}
      hidden={!open}
    >
      <div className="sidebar__section-links">{children}</div>
    </div>
  );

  return (
    <>
      <div
        className={`sidebar__section${flyout ? " sidebar__section--flyout" : ""}${open && flyout ? " sidebar__section--flyout-open" : ""}`}
      >
        <button
          ref={headRef}
          type="button"
          id={`${panelId}-btn`}
          className="sidebar__section-head"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="sidebar__label sidebar__label--toggle">{label}</span>
          <span
            className={`sidebar__chevron${flyout ? " sidebar__chevron--flyout" : ""}${open ? " sidebar__chevron--open" : ""}`}
            aria-hidden
          >
            <IconChevronSidebar />
          </span>
        </button>
        {!fixedFlyout ? panel : null}
      </div>
      {fixedFlyout ? createPortal(panel, document.body) : null}
    </>
  );
}

// Navegación lateral agrupada (estilo operador).
export function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const { t, locale, setLocale } = useTranslation();
  const { user, logout, loading } = useAuth();
  const staff = user && !user.isClientPortal;
  const isPortal = !!user?.isClientPortal;

  const [openGroups, setOpenGroups] = useState(() => ({ ...SIDEBAR_OPEN_INITIAL }));

  useLayoutEffect(() => {
    setOpenGroups(getSidebarOpenInitial());
  }, [pathname, user, staff, isPortal]);

  function toggleSection(id) {
    setOpenGroups((prev) => {
      const opening = !prev[id];
      const next = { ...prev, [id]: opening };
      if (opening) {
        for (const key of Object.keys(next)) {
          if (key !== id) next[key] = false;
        }
      }
      return next;
    });
  }
  const sidebarDisplayName = user
    ? user.isClientPortal
      ? user.clientName || t("sidebar.clientPortalFallback")
      : user.companyName || t("sidebar.companyFallback")
    : "";

  function handleNav() {
    closeFlyouts();
    onNavigate?.();
  }

  const navCls = ({ isActive }) =>
    `shell-nav-menu__item sidebar__link${isActive ? " shell-nav-menu__item--active sidebar__link--active" : ""}`;

  function handlePrefetch(to) {
    prefetchRoute(to);
  }

  function closeFlyouts() {
    setOpenGroups(getSidebarOpenInitial());
  }

  const showFlyoutBackdrop = isDesktopSidebarFlyout() && Object.values(openGroups).some(Boolean);

  return (
    <>
      {showFlyoutBackdrop
        ? createPortal(
            <button
              type="button"
              className="sidebar-flyout-backdrop"
              aria-label={t("mainLayout.closeMenu")}
              onClick={closeFlyouts}
            />,
            document.body
          )
        : null}
      <div className="sidebar__inner">
        <div className="sidebar__brand">
          <Link to="/" className="sidebar__logo-link" onClick={handleNav}>
            <span className="sidebar__logo-mark" aria-hidden>
              <BrandMark size={40} />
            </span>
            <div>
              <span className="sidebar__logo-title">{appName}</span>
              <span className="sidebar__logo-sub">{t("brand.tagline")}</span>
            </div>
          </Link>
        </div>

        <nav className="sidebar__nav" aria-label={t("sidebar.ariaPrimary")}>
          {user && (
            <>
              <SidebarModuleNav
                staff={staff}
                navCls={navCls}
                handleNav={handleNav}
                handlePrefetch={handlePrefetch}
                t={t}
                SidebarNavSection={SidebarNavSection}
                openGroups={openGroups}
                toggleSection={toggleSection}
              />
            </>
          )}

          {!user && (
            <SidebarNavSection
              sectionId="account"
              label={t("sidebar.groupAccount")}
              open={openGroups.account}
              onToggle={() => toggleSection("account")}
            >
              {loading && <span className="sidebar__muted">{t("sidebar.loading")}</span>}
              {!loading && (
                <>
                  <NavLink
                    to="/login"
                    className={navCls}
                    onClick={handleNav}
                    onMouseEnter={() => handlePrefetch("/login")}
                  >
                    <span className="sidebar__icon sidebar__icon--text">→</span>
                    <span>{t("sidebar.login")}</span>
                  </NavLink>
                  <NavLink
                    to="/register"
                    className={({ isActive }) =>
                      `sidebar__link sidebar__link--cta${isActive ? " sidebar__link--active" : ""}`
                    }
                    onClick={handleNav}
                    onMouseEnter={() => handlePrefetch("/register")}
                  >
                    <span className="sidebar__icon sidebar__icon--text">+</span>
                    <span>{t("sidebar.createAccount")}</span>
                  </NavLink>
                </>
              )}
            </SidebarNavSection>
          )}
        </nav>

        <div className="sidebar__bottom">
          <div className="sidebar__prefs" role="group" aria-label={t("sidebar.prefsAria")}>
            <div className="sidebar__pref-col">
              <span className="sidebar__appearance-label">{t("language.label")}</span>
              <div className="sidebar__lang-seg" role="group" aria-label={t("language.label")}>
                <button
                  type="button"
                  className={`sidebar__lang-btn${locale === "en" ? " sidebar__lang-btn--active" : ""}`}
                  onClick={() => setLocale("en")}
                  aria-pressed={locale === "en"}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`sidebar__lang-btn${locale === "es" ? " sidebar__lang-btn--active" : ""}`}
                  onClick={() => setLocale("es")}
                  aria-pressed={locale === "es"}
                >
                  ES
                </button>
              </div>
            </div>
            <div className="sidebar__pref-col sidebar__pref-col--theme">
              <span className="sidebar__appearance-label">{t("sidebar.theme")}</span>
              <ThemeToggle className="sidebar__theme-toggle" />
            </div>
          </div>
          {user && (
            <div className="sidebar__user">
              <div className="sidebar__user-panel">
                <span className="sidebar__user-label">{t("sidebar.groupAccount")}</span>
                <div className="sidebar__user-card">
                  <div className="sidebar__user-avatar" aria-hidden>
                    {getSidebarInitials(sidebarDisplayName, user.email)}
                  </div>
                  <div className="sidebar__user-text">
                    <span className="sidebar__user-title">{sidebarDisplayName}</span>
                    <span className="sr-only">{user.email}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="sidebar__logout"
                onClick={() => {
                  logout();
                  handleNav();
                }}
              >
                {t("sidebar.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
