import { Link } from "react-router-dom";
import { RevealOnScroll } from "./RevealOnScroll.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";

const ITEM_KEYS = ["b1", "b2", "b3"];

// Banda de novedades en home pública (enlace a /changelog).
export function HomeWhatsNewSection() {
  const { t } = useTranslation();

  return (
    <RevealOnScroll className="breakout home-whats-new" delayMs={40}>
      <div className="breakout__glow" aria-hidden />
      <div className="home-whats-new__inner">
        <header className="home-whats-new__intro">
          <span className="breakout__badge">{t("track.homeWhatsNew.badge")}</span>
          <h2 className="home-whats-new__title">
            <span className="breakout__title-line">{t("track.homeWhatsNew.title")}</span>
          </h2>
          <p className="home-whats-new__lead">{t("track.homeWhatsNew.lead")}</p>
          <Link to="/changelog" className="btn btn--primary home-whats-new__cta">
            <span>{t("track.homeWhatsNew.cta")}</span>
            <span className="home-whats-new__cta-icon" aria-hidden>
              →
            </span>
          </Link>
        </header>
        <ul className="home-whats-new__cards" aria-label={t("track.homeWhatsNew.aria")}>
          {ITEM_KEYS.map((key, i) => (
            <li key={key} className="home-whats-new__card">
              <span className="home-whats-new__idx" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="home-whats-new__card-text">{t(`track.homeWhatsNew.${key}`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </RevealOnScroll>
  );
}
