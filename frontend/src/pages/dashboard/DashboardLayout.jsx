import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { NotificationBell } from "../../components/NotificationBell.jsx";
import { OnboardingBanner } from "../../components/OnboardingBanner.jsx";
import { useTranslation } from "../../i18n/LanguageContext.jsx";
import { MainLayout } from "../../layouts/MainLayout.jsx";
import { DashboardWorkspaceProvider, useDashboardWorkspace } from "./DashboardWorkspaceContext.jsx";
import { getWorkspaceTitles } from "./workspaceConfig.js";
import { WorkspaceNav } from "./WorkspaceNav.jsx";

function DashboardShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isClientPortal, error } = useDashboardWorkspace();
  const { headline } = useMemo(
    () => getWorkspaceTitles(location.pathname, isClientPortal, t),
    [location.pathname, isClientPortal, t]
  );

  // Empresa y email van en sidebar; contexto extra solo en portal cliente.
  const showPortalContext =
    isClientPortal && (user?.companyName || user?.clientName);

  const topbarExtra = user ? (
    <>
      {!isClientPortal ? <NotificationBell /> : null}
      <kbd className="topbar__kbd-hint" title={t("commandPalette.hint")}>
        ⌘K
      </kbd>
    </>
  ) : null;

  return (
    <MainLayout dataSource={null} title={headline} topbarExtra={topbarExtra}>
      <div className="page-dash dash">
        <OnboardingBanner />
        {showPortalContext ? (
          <header className="dash__intro">
            <p className="dash__sub dash__sub--wrap dash__sub--lead">
              {user?.companyName ? <span className="dash__company">{user.companyName}</span> : null}
              {user?.companyName && user?.clientName ? (
                <span className="dash__sep" aria-hidden>
                  ·
                </span>
              ) : null}
              {user?.clientName ? (
                <>
                  <span className="dash__invite-label">{t("workspace.clientLabel")}</span>{" "}
                  <strong>{user.clientName}</strong>
                </>
              ) : null}
            </p>
          </header>
        ) : null}

        <WorkspaceNav isClientPortal={isClientPortal} />
        <p className="dash__help-link">
          <Link to="/how-it-works/workspace">{t("mainLayout.howItWorks")}</Link>
        </p>

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        <Outlet />
      </div>
    </MainLayout>
  );
}

export function DashboardLayout() {
  return (
    <DashboardWorkspaceProvider>
      <DashboardShell />
    </DashboardWorkspaceProvider>
  );
}
