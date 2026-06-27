import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark.jsx";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { appName } from "../config/siteMeta.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

/** Auth pages: product story left, form right. */
export function AuthSplitLayout({ children }) {
  const { t } = useTranslation();

  return (
    <MainLayout dataSource={null}>
      <div className="auth-page auth-page--split">
        <aside className="auth-promo breakout" aria-label={t("auth.panelAria")}>
          <div className="breakout__glow" aria-hidden />
          <div className="auth-promo__inner">
            <div className="auth-promo__brand">
              <BrandMark size={36} />
              <span className="auth-promo__name">{appName}</span>
            </div>
            <p className="auth-promo__eyebrow">{t("brand.tagline")}</p>
            <h2 className="auth-promo__title">{t("auth.panelTitle")}</h2>
            <p className="auth-promo__lead">{t("auth.panelLead")}</p>
            <ul className="auth-promo__list">
              <li>{t("auth.panelF1")}</li>
              <li>{t("auth.panelF2")}</li>
              <li>{t("auth.panelF3")}</li>
            </ul>
            <p className="auth-promo__free">{t("auth.panelFree")}</p>
            <Link to="/track" className="auth-promo__track-link">
              {t("auth.panelTrackLink")} →
            </Link>
          </div>
        </aside>
        <div className="auth-panel">{children}</div>
      </div>
    </MainLayout>
  );
}
