import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark.jsx";
import { RevealOnScroll } from "../components/RevealOnScroll.jsx";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { appName } from "../config/siteMeta.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

const FLOW_STEPS = [
  { key: "stepOrder", bodyKey: "stepOrderBody", live: true },
  { key: "stepBooking", bodyKey: "stepBookingBody", live: true },
  { key: "stepTransport", bodyKey: "stepTransportBody", live: false },
  { key: "stepDocuments", bodyKey: "stepDocumentsBody", live: false },
  { key: "stepVisibility", bodyKey: "stepVisibilityBody", live: true },
];

export function MarketingHomePage() {
  const { t } = useTranslation();

  return (
    <MainLayout dataSource={null}>
      <div className="marketing-page" aria-label={t("marketing.aria")}>
        <section className="marketing-hero hero hero--elevated breakout">
          <div className="breakout__glow" aria-hidden />
          <div className="marketing-hero__grid">
            <div className="marketing-hero__copy">
              <div className="hero__brand">
                <BrandMark size={32} />
                <p className="hero__eyebrow">{appName}</p>
              </div>
              <p className="marketing-hero__eyebrow">{t("marketing.hero.eyebrow")}</p>
              <h1 className="hero__headline">{t("marketing.hero.title")}</h1>
              <p className="hero__sub hero__sub--pitch">{t("marketing.hero.lead")}</p>
              <div className="hero__cta-row">
                <Link to="/register" className="btn btn--primary">
                  {t("marketing.hero.ctaPrimary")}
                </Link>
                <Link to="/login" className="btn btn--secondary">
                  {t("marketing.hero.ctaSecondary")}
                </Link>
              </div>
              <Link to="/track" className="marketing-hero__track-link">
                {t("marketing.hero.ctaTrack")}
              </Link>
            </div>
            <div className="marketing-hero__visual">
              <img
                src="/images/home-value-workspace.png"
                alt={t("marketing.hero.imageAlt")}
                className="marketing-hero__img"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <RevealOnScroll className="home-landing__panel breakout">
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h">{t("marketing.audience.title")}</h2>
          <p className="home-landing__lead">{t("marketing.audience.lead")}</p>
          <ul className="home-landing__grid">
            <li className="home-landing__card">
              <div className="home-landing__card-copy">
                <h3 className="home-landing__card-title">{t("marketing.audience.forwarderTitle")}</h3>
                <p className="home-landing__card-body">{t("marketing.audience.forwarderBody")}</p>
              </div>
            </li>
            <li className="home-landing__card">
              <div className="home-landing__card-copy">
                <h3 className="home-landing__card-title">{t("marketing.audience.exporterTitle")}</h3>
                <p className="home-landing__card-body">{t("marketing.audience.exporterBody")}</p>
              </div>
            </li>
            <li className="home-landing__card">
              <div className="home-landing__card-copy">
                <h3 className="home-landing__card-title">{t("marketing.audience.importerTitle")}</h3>
                <p className="home-landing__card-body">{t("marketing.audience.importerBody")}</p>
              </div>
            </li>
          </ul>
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel breakout" delayMs={60}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h">{t("marketing.flow.title")}</h2>
          <p className="home-landing__lead">{t("marketing.flow.lead")}</p>
          <ol className="marketing-flow">
            {FLOW_STEPS.map(({ key, bodyKey, live }) => (
              <li key={key} className="marketing-flow__step">
                <span className="marketing-flow__badge" data-live={live ? "true" : "false"}>
                  {live ? t("marketing.flow.badgeLive") : t("marketing.flow.badgeSoon")}
                </span>
                <h3 className="marketing-flow__title">{t(`marketing.flow.${key}`)}</h3>
                <p className="marketing-flow__body">{t(`marketing.flow.${bodyKey}`)}</p>
              </li>
            ))}
          </ol>
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel breakout" delayMs={80}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h">{t("marketing.features.title")}</h2>
          <p className="home-landing__lead">{t("marketing.features.lead")}</p>
          <ul className="home-landing__grid">
            <li className="home-landing__card">
              <div className="home-landing__card-copy">
                <h3 className="home-landing__card-title">{t("marketing.features.ordersTitle")}</h3>
                <p className="home-landing__card-body">{t("marketing.features.ordersBody")}</p>
              </div>
            </li>
            <li className="home-landing__card">
              <div className="home-landing__card-copy">
                <h3 className="home-landing__card-title">{t("marketing.features.bookingsTitle")}</h3>
                <p className="home-landing__card-body">{t("marketing.features.bookingsBody")}</p>
              </div>
            </li>
            <li className="home-landing__card">
              <div className="home-landing__card-copy">
                <h3 className="home-landing__card-title">{t("marketing.features.clientsTitle")}</h3>
                <p className="home-landing__card-body">{t("marketing.features.clientsBody")}</p>
              </div>
            </li>
          </ul>
          <div className="marketing-features__actions">
            <Link to="/register" className="btn btn--secondary">
              {t("marketing.features.ctaOrders")}
            </Link>
            <Link to="/track" className="btn btn--ghost">
              {t("marketing.features.ctaTrack")} →
            </Link>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="home-guest-promo breakout" delayMs={100}>
          <div className="breakout__glow" aria-hidden />
          <div className="home-guest-promo__inner">
            <div className="home-guest-promo__text">
              <h2 className="home-guest-promo__title">{t("marketing.mission.title")}</h2>
              <p className="home-guest-promo__lead">{t("marketing.mission.lead")}</p>
              <ul className="home-guest-promo__features">
                <li className="home-guest-promo__feature">
                  <span className="home-guest-promo__dot" aria-hidden />
                  <span className="home-guest-promo__feature-text">{t("marketing.mission.b1")}</span>
                </li>
                <li className="home-guest-promo__feature">
                  <span className="home-guest-promo__dot" aria-hidden />
                  <span className="home-guest-promo__feature-text">{t("marketing.mission.b2")}</span>
                </li>
                <li className="home-guest-promo__feature">
                  <span className="home-guest-promo__dot" aria-hidden />
                  <span className="home-guest-promo__feature-text">{t("marketing.mission.b3")}</span>
                </li>
              </ul>
              <div className="home-guest-promo__actions">
                <Link to="/register" className="btn btn--primary">
                  {t("marketing.mission.ctaRegister")}
                </Link>
                <Link to="/login" className="btn btn--secondary">
                  {t("marketing.hero.ctaSecondary")}
                </Link>
              </div>
            </div>
            <div className="home-guest-promo__visual home-guest-promo__visual--photo">
              <img
                className="home-guest-promo__img"
                src="/images/home-value-clients.png"
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </MainLayout>
  );
}
