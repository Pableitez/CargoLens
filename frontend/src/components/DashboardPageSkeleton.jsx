import { useTranslation } from "../i18n/LanguageContext.jsx";

// Placeholders mientras cargan datos o chunks (sensación de rapidez).
export function DashboardPageSkeleton({ rows = 4 }) {
  const { t } = useTranslation();
  return (
    <div className="dash-skeleton" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("routeLoading")}</span>
      <div className="dash-skeleton__header">
        <div className="dash-skeleton__line dash-skeleton__line--title" />
        <div className="dash-skeleton__line dash-skeleton__line--meta" />
      </div>
      <div className="dash-skeleton__table">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="dash-skeleton__row">
            <div className="dash-skeleton__cell" />
            <div className="dash-skeleton__cell dash-skeleton__cell--short" />
            <div className="dash-skeleton__cell dash-skeleton__cell--grow" />
          </div>
        ))}
      </div>
    </div>
  );
}
