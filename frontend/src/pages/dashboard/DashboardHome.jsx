import { useTranslation } from "../../i18n/LanguageContext.jsx";
import { useDashboardWorkspace } from "./DashboardWorkspaceContext.jsx";

export function DashboardHome() {
  const { t } = useTranslation();
  const { isClientPortal, user } = useDashboardWorkspace();

  const title = isClientPortal
    ? (user?.clientName ?? t("dashboardHome.titlePortal"))
    : t("dashboardHome.title");

  return (
    <section
      className="panel panel--dash-form panel--module-hub panel--module-hub--operations dash-home dash-home--placeholder"
      aria-labelledby="dash-home-heading"
    >
      <h1 id="dash-home-heading" className="sr-only">
        {title}
      </h1>

      <div className="trade-setup-empty dash-home__placeholder">
        <p className="trade-setup-empty__title">{t("dashboardHome.placeholderTitle")}</p>
      </div>
    </section>
  );
}
