import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ApiStatusBanner } from "../components/ApiStatusBanner.jsx";
import { PublicShellPrefs } from "../components/PublicShellPrefs.jsx";
import { Sidebar } from "../components/Sidebar.jsx";
import { appName, developerCredit } from "../config/siteMeta.js";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { useDesktopRail } from "../hooks/useDesktopRail.js";

/**
 * Barra superior: título de página cuando aplica; si no, queda limpia (marca solo en sidebar).
 */
export function MainLayout({ children, title, subtitle, topbarExtra, topbarNav }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const desktopRail = useDesktopRail();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.hash]);

  const showPageTitle = typeof title === "string" && title.length > 0;

  return (
    <div className="layout layout--shell">
      <aside
        className={`sidebar${sidebarOpen ? " sidebar--open" : ""}${desktopRail ? " sidebar--collapsed" : ""}`}
        aria-label={t("mainLayout.navMain")}
      >
        <Sidebar collapsed={desktopRail} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <button
        type="button"
        className={`sidebar-backdrop${sidebarOpen ? " sidebar-backdrop--visible" : ""}`}
        aria-label={t("mainLayout.closeMenu")}
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="layout__column">
        <ApiStatusBanner />
        <header className="topbar topbar--shell">
          <div className="topbar__shell-bg-wrap" aria-hidden>
            <div className="topbar__shell-bg" />
          </div>
          <div className="topbar__inner">
            <button
              type="button"
              className="topbar__menu"
              aria-label={t("mainLayout.openMenu")}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="topbar__menu-bars" aria-hidden />
            </button>
            {showPageTitle ? (
              <div className="topbar__heading">
                <h1 className="topbar__title">{title}</h1>
                {subtitle ? <p className="topbar__subtitle">{subtitle}</p> : null}
              </div>
            ) : (
              <div className="topbar__heading topbar__heading--minimal" aria-hidden="true" />
            )}
            {topbarNav ? <div className="topbar__nav">{topbarNav}</div> : null}
            <div className="topbar__right">
              {!user ? <PublicShellPrefs /> : null}
              {topbarExtra ? <div className="topbar__extras no-print">{topbarExtra}</div> : null}
            </div>
          </div>
        </header>

        <main className="main main--shell" id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer className="footer footer--shell footer--shell-minimal">
          <div className="footer__shell-bar">
            <p className="footer__shell-copy">
              © {developerCredit.year} {appName}
            </p>
            <nav className="footer__legal-links" aria-label={t("mainLayout.footerLegalNav")}>
              <Link to="/how-it-works" className="footer__legal-link">
                {t("mainLayout.howItWorks")}
              </Link>
              <span className="footer__sep" aria-hidden>
                ·
              </span>
              <Link to="/privacy" className="footer__legal-link">
                {t("mainLayout.privacy")}
              </Link>
              <span className="footer__sep" aria-hidden>
                ·
              </span>
              <Link to="/terms" className="footer__legal-link">
                {t("mainLayout.terms")}
              </Link>
              <span className="footer__sep" aria-hidden>
                ·
              </span>
              <Link to="/changelog" className="footer__legal-link">
                {t("mainLayout.changelog")}
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
