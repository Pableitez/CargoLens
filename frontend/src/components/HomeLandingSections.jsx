import { Link } from "react-router-dom";
import { RevealOnScroll } from "./RevealOnScroll.jsx";
import { HomeWhatsNewSection } from "./HomeWhatsNewSection.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";

// Bloques bajo el hero en home (invitados; animación al scroll).
export function HomeLandingSections() {
  const { t } = useTranslation();

  return (
    <div className="home-landing" aria-label={t("track.homeLanding.aria")}>
      <HomeWhatsNewSection />
      <RevealOnScroll className="home-landing__panel breakout">
        <div className="breakout__glow" aria-hidden />
        <h2 className="home-landing__h">{t("track.homeLanding.valueTitle")}</h2>
        <p className="home-landing__lead">{t("track.homeLanding.valueLead")}</p>
        <ul className="home-landing__grid">
          <li className="home-landing__card">
            <div className="home-landing__card-media">
              <img
                src="/images/home-value-search.png"
                alt={t("track.homeLanding.card1ImageAlt")}
                className="home-landing__card-img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="home-landing__card-copy">
              <h3 className="home-landing__card-title">{t("track.homeLanding.card1Title")}</h3>
              <p className="home-landing__card-body">{t("track.homeLanding.card1Body")}</p>
            </div>
          </li>
          <li className="home-landing__card">
            <div className="home-landing__card-media">
              <img
                src="/images/home-value-workspace.png"
                alt={t("track.homeLanding.card2ImageAlt")}
                className="home-landing__card-img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="home-landing__card-copy">
              <h3 className="home-landing__card-title">{t("track.homeLanding.card2Title")}</h3>
              <p className="home-landing__card-body">{t("track.homeLanding.card2Body")}</p>
            </div>
          </li>
          <li className="home-landing__card">
            <div className="home-landing__card-media">
              <img
                src="/images/home-value-clients.png"
                alt={t("track.homeLanding.card3ImageAlt")}
                className="home-landing__card-img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="home-landing__card-copy">
              <h3 className="home-landing__card-title">{t("track.homeLanding.card3Title")}</h3>
              <p className="home-landing__card-body">{t("track.homeLanding.card3Body")}</p>
            </div>
          </li>
        </ul>
      </RevealOnScroll>

      <RevealOnScroll className="home-landing__panel home-landing__panel--narrow breakout" delayMs={80}>
        <div className="breakout__glow" aria-hidden />
        <h2 className="home-landing__h">{t("track.homeLanding.bottomTitle")}</h2>
        <p className="home-landing__lead">{t("track.homeLanding.bottomBody")}</p>
        <div className="home-landing__links">
          <Link to="/vessels" className="home-landing__inline-link">
            {t("track.homeLanding.linkVessels")} →
          </Link>
          <Link to="/how-it-works/track" className="home-landing__inline-link">
            {t("track.homeLanding.linkHow")} →
          </Link>
        </div>
      </RevealOnScroll>
    </div>
  );
}
