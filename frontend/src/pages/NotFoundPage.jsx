import { Link } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { DASHBOARD_OVERVIEW_PATH } from "../config/paths.js";

export function NotFoundPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <MainLayout title={t("pageTitle.notFound")} dataSource={null}>
      <div className="not-found">
        <p className="not-found__lead">{t("notFound.lead")}</p>
        <div className="not-found__actions">
          <Link to="/" className="not-found__link not-found__link--primary">
            {t("notFound.home")}
          </Link>
          {user ? (
            <Link to={DASHBOARD_OVERVIEW_PATH} className="not-found__link">
              {t("notFound.dashboard")}
            </Link>
          ) : (
            <Link to="/login" className="not-found__link">
              {t("notFound.login")}
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
