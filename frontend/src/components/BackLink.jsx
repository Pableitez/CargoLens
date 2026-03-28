import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext.jsx";

// Volver atrás (por defecto al inicio).
export function BackLink({ to = "/", className = "" }) {
  const { t } = useTranslation();
  return (
    <div className={`back-link-wrap${className ? ` ${className}` : ""}`}>
      <Link to={to} className="back-link" aria-label={t("components.backLink.aria")}>
        <span className="back-link__chevron" aria-hidden>
          ←
        </span>
        {t("components.backLink.label")}
      </Link>
    </div>
  );
}
