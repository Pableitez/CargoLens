import { useTranslation } from "../i18n/LanguageContext.jsx";

export function LoadingSkeleton({ compact = false }) {
  const { t } = useTranslation();
  return (
    <div
      className={`skeleton-root${compact ? " skeleton-root--compact" : ""}`}
      aria-busy="true"
      aria-label={t("components.loadingSkeleton.aria")}
    >
      <p className="skeleton-root__label">{t("components.loadingSkeleton.label")}</p>
      {!compact && <div className="skeleton skeleton--hero" />}
      <div className={`skeleton-grid${compact ? " skeleton-grid--compact" : ""}`}>
        <div className="skeleton skeleton--card" />
        <div className="skeleton skeleton--map" />
        {!compact && <div className="skeleton skeleton--wide" />}
      </div>
    </div>
  );
}
