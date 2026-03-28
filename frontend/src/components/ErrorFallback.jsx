import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function ErrorFallback({ onRetry }) {
  const { t } = useTranslation();

  return (
    <div className="error-shell">
      <div className="error-shell__card">
        <p className="error-shell__title">{t("error.title")}</p>
        <p className="error-shell__body">{t("error.body")}</p>
        <div className="error-shell__actions">
          <button type="button" className="error-shell__btn error-shell__btn--primary" onClick={onRetry}>
            {t("error.retry")}
          </button>
          <Link to="/" className="error-shell__btn error-shell__link">
            {t("error.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
