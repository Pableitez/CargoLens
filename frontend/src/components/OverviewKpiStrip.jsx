import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext.jsx";

// KPIs del resumen: guardados / asignados / sin asignar (enlaces a la lista).
export function OverviewKpiStrip({ workspace }) {
  const { t } = useTranslation();
  if (!workspace?.total) return null;

  return (
    <div className="overview-kpi-strip" role="region" aria-label={t("dashboardPage.overview.kpiAria")}>
      <Link
        className="overview-kpi-strip__card overview-kpi-strip__card--link"
        to="/dashboard/list"
        aria-label={t("dashboardPage.overview.kpiAriaOpenList", { label: t("dashboardPage.overview.kpiSaved") })}
      >
        <span className="overview-kpi-strip__value">{workspace.total}</span>
        <span className="overview-kpi-strip__label">{t("dashboardPage.overview.kpiSaved")}</span>
      </Link>
      <Link
        className="overview-kpi-strip__card overview-kpi-strip__card--link"
        to="/dashboard/list?scope=assigned"
        aria-label={t("dashboardPage.overview.kpiAriaOpenList", { label: t("dashboardPage.overview.kpiAssigned") })}
      >
        <span className="overview-kpi-strip__value">{workspace.assigned}</span>
        <span className="overview-kpi-strip__label">{t("dashboardPage.overview.kpiAssigned")}</span>
      </Link>
      <Link
        className="overview-kpi-strip__card overview-kpi-strip__card--link"
        to="/dashboard/list?scope=unassigned"
        aria-label={t("dashboardPage.overview.kpiAriaOpenList", { label: t("dashboardPage.overview.kpiUnassigned") })}
      >
        <span className="overview-kpi-strip__value">{workspace.unassigned}</span>
        <span className="overview-kpi-strip__label">{t("dashboardPage.overview.kpiUnassigned")}</span>
      </Link>
    </div>
  );
}
