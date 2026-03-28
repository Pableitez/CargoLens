import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext.jsx";

// Migas de pan accesibles (último ítem puede ser solo texto).
export function PageBreadcrumb({ items }) {
  const { t } = useTranslation();
  if (!items?.length) return null;
  return (
    <nav className="page-breadcrumb" aria-label={t("components.pageBreadcrumb.aria")}>
      <ol className="page-breadcrumb__list">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="page-breadcrumb__item">
            {i > 0 ? (
              <span className="page-breadcrumb__sep" aria-hidden>
                ·
              </span>
            ) : null}
            {it.to ? (
              <Link to={it.to} className="page-breadcrumb__link">
                {it.label}
              </Link>
            ) : (
              <span className="page-breadcrumb__current">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
