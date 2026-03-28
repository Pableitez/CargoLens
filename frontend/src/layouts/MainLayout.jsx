import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ApiStatusBanner } from "../components/ApiStatusBanner.jsx";
import { BrandMark } from "../components/BrandMark.jsx";
import { Sidebar } from "../components/Sidebar.jsx";
import { appName, developerCredit } from "../config/siteMeta.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

/**
 * Barra superior: solo texto (título o nombre+tagline). El logo va en la sidebar y en el pie — evita duplicar el mismo símbolo.
 */
export function MainLayout({ children, dataSource, title, subtitle, topbarExtra }) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.hash]);

  const sourceLine =
    dataSource === "safecube"
      ? t("mainLayout.liveSinay")
      : dataSource === "mock"
        ? t("mainLayout.demoNoKey")
        : null;

  const hasPageTitle = Boolean(title);

  return (
    <div className="layout layout--shell">
      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`} aria-label={t("mainLayout.navMain")}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
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
            {hasPageTitle ? (
              <div className="topbar__heading">
                <h1 className="footer__brand-name">{title}</h1>
                {subtitle ? <p className="footer__brand-tag">{subtitle}</p> : null}
              </div>
            ) : (
              <div className="topbar__heading">
                <div className="footer__brand-name">{appName}</div>
                <p className="footer__brand-tag">{t("brand.tagline")}</p>
              </div>
            )}
            {topbarExtra || sourceLine ? (
              <div className="topbar__right">
                {topbarExtra ? <div className="topbar__extras no-print">{topbarExtra}</div> : null}
                {sourceLine ? (
                  <span
                    className="topbar__pill"
                    role="status"
                    data-mode={dataSource === "safecube" ? "live" : "demo"}
                  >
                    {sourceLine}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <main className="main main--shell" id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer className="footer footer--shell">
          <div className="footer__shell-bg" aria-hidden />
          <div className="footer__grid">
            <div className="footer__block footer__block--brand">
              <div className="footer__brand">
                <span className="footer__brand-mark" aria-hidden>
                  <BrandMark size={40} />
                </span>
                <div className="footer__brand-text">
                  <div className="footer__brand-name">{appName}</div>
                  <p className="footer__brand-tag">{t("brand.tagline")}</p>
                </div>
              </div>
            </div>
            <div className="footer__developer" aria-label={t("mainLayout.projectCredits")}>
              <p className="footer__dev-title">{t("mainLayout.project")}</p>
              <p className="footer__dev-name">
                {appName}
                <span className="footer__dev-year" aria-hidden>
                  {" "}
                  · {developerCredit.year}
                </span>
              </p>
              <p className="footer__dev-person">
                {developerCredit.name}
                {developerCredit.role ? (
                  <span className="footer__dev-role"> · {developerCredit.role}</span>
                ) : null}
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
          </div>
        </footer>
      </div>
    </div>
  );
}
